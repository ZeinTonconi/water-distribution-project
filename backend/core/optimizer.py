from ortools.linear_solver import pywraplp
from models.enums import Priority


# def run_optimized(
#     demand: list[list[float]],      # demand[i][t] = liters needed by crop i in week t
#     tank_capacity: float,         # max tank capacity in liters
#     tank_current_l: float,          # current tank level in liters
#     weekly_rainfall_l: list[float], # rainfall[t] = liters entering tank in week t
#     min_water: list[float],         # min_water[i] = minimum liters/week for crop i
#     drought_tolerance: list[int],   # drought_tolerance[i] = 1..5
#     priority: Priority,
#     n_crops: int,
#     n_weeks: int
# ) -> dict:
#     solver = pywraplp.Solver.CreateSolver("GLOP")
#     if not solver:
#         raise RuntimeError("Could not create GLOP solver")

#     # x[i][t] = liters allocated to crop i in week t
#     x = []
#     for i in range(n_crops):
#         week_vars = []
#         for t in range(n_weeks):
#             var = solver.NumVar(0.0, demand[i][t], f"x_{i}_{t}")
#             week_vars.append(var)
#         x.append(week_vars)

#     tank = []
#     for t in range(n_weeks):
#         var = solver.NumVar(0.0, tank_capacity, f"tank_{t}")
#         tank.append(var)

#     balance_0 = solver.Constraint(
#         tank_current_l + weekly_rainfall_l[0],
#         tank_current_l + weekly_rainfall_l[0],
#         "tank_balance_0"
#     )
#     balance_0.SetCoefficient(tank[0], 1.0)
#     for i in range(n_crops):
#         balance_0.SetCoefficient(x[i][0], 1.0)

#     for t in range(1, n_weeks):
#         rain = weekly_rainfall_l[t]
#         balance = solver.Constraint(rain, rain, f"tank_balance_{t}")
#         balance.SetCoefficient(tank[t], 1.0)
#         balance.SetCoefficient(tank[t - 1], -1.0)
#         for i in range(n_crops):
#             balance.SetCoefficient(x[i][t], 1.0)
    
#     objective = solver.Objective()

#     if priority == Priority.sensitive:
#         for i in range(n_crops):
#             weight = float(6 - drought_tolerance[i])
#             for t in range(n_weeks):
#                 objective.SetCoefficient(x[i][t], weight)

#     elif priority == Priority.equal:
#         for i in range(n_crops):
#             for t in range(n_weeks):
#                 if demand[i][t] > 0:
#                     objective.SetCoefficient(x[i][t], 1.0 / demand[i][t])

#     elif priority == Priority.economic:
#         for i in range(n_crops):
#             weight = float(6 - drought_tolerance[i])
#             for t in range(n_weeks):
#                 objective.SetCoefficient(x[i][t], weight)

#     objective.SetMaximization()

#     status = solver.Solve()

#     if status not in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE):
#         return {"status": "infeasible", "allocation": [], "tank_levels": []}

#     allocation = [
#         [x[i][t].solution_value() for t in range(n_weeks)]
#         for i in range(n_crops)
#     ]
#     tank_levels = [tank[t].solution_value() for t in range(n_weeks)]

#     return {
#         "status": "optimal",
#         "allocation": allocation,
#         "tank_levels": tank_levels
#     }

from ortools.linear_solver import pywraplp
from models.enums import Priority


def run_optimized(
    demand: list[list[float]],
    tank_capacity: float,
    tank_current_l: float,
    weekly_rainfall_l: list[float],
    drought_tolerance: list[int],
    n_crops: int,
    n_weeks: int
) -> dict:

    solver = pywraplp.Solver.CreateSolver("GLOP")
    if not solver:
        raise RuntimeError("Could not create solver")

    # =========================
    # VARIABLES
    # =========================

    # Water allocation
    x = [
        [solver.NumVar(0.0, demand[i][t], f"x_{i}_{t}")
         for t in range(n_weeks)]
        for i in range(n_crops)
    ]

    # Tank levels
    tank = [
        solver.NumVar(0.0, tank_capacity, f"tank_{t}")
        for t in range(n_weeks)
    ]

    # Deficit (accumulated stress)
    deficit = [
        [solver.NumVar(0.0, solver.infinity(), f"deficit_{i}_{t}")
         for t in range(n_weeks)]
        for i in range(n_crops)
    ]

    # =========================
    # TANK BALANCE
    # =========================

    # Week 0
    solver.Add(
        tank[0] ==
        tank_current_l
        + weekly_rainfall_l[0]
        - sum(x[i][0] for i in range(n_crops))
    )

    # Following weeks
    for t in range(1, n_weeks):
        solver.Add(
            tank[t] ==
            tank[t - 1]
            + weekly_rainfall_l[t]
            - sum(x[i][t] for i in range(n_crops))
        )

    # =========================
    # DEFICIT DYNAMICS
    # =========================

    for i in range(n_crops):

        # Week 0
        solver.Add(
            deficit[i][0] ==
            demand[i][0] - x[i][0]
        )

        for t in range(1, n_weeks):
            solver.Add(
                deficit[i][t] ==
                deficit[i][t - 1]
                + demand[i][t]
                - x[i][t]
            )

    # =========================
    # SURVIVAL CONSTRAINT
    # =========================

    # FAO-style idea: crops tolerate limited deficit
    # More tolerant crops → allow higher deficit

    for i in range(n_crops):
        total_demand = sum(demand[i])

        # tolerance factor: 1 (sensitive) → 5 (very tolerant)
        tol = drought_tolerance[i]

        # You can tune this:
        # sensitive crops: ~30% deficit allowed
        # tolerant crops: ~80% deficit allowed
        max_deficit_fraction = 0.2 + 0.15 * tol

        solver.Add(
            deficit[i][n_weeks - 1] <= max_deficit_fraction * total_demand
        )

    # =========================
    # OBJECTIVE
    # =========================

    objective = solver.Objective()

    for i in range(n_crops):
        tol = drought_tolerance[i]

        # Sensitive crops penalized more if stressed
        weight = float(6 - tol)

        # Minimize FINAL deficit (not weekly!)
        objective.SetCoefficient(
            deficit[i][n_weeks - 1],
            -weight
        )

    objective.SetMaximization()

    # =========================
    # SOLVE
    # =========================

    status = solver.Solve()

    if status not in (
        pywraplp.Solver.OPTIMAL,
        pywraplp.Solver.FEASIBLE
    ):
        return {"status": "infeasible", "allocation": [], "tank_levels": []}

    allocation = [
        [x[i][t].solution_value() for t in range(n_weeks)]
        for i in range(n_crops)
    ]

    tank_levels = [
        tank[t].solution_value() for t in range(n_weeks)
    ]

    return {
        "status": "optimal",
        "allocation": allocation,
        "tank_levels": tank_levels
    }


def run_naive(
    demand: list[list[float]],
    tank_capacity: float,
    tank_current_l: float,
    weekly_rainfall_l: list[float],
    n_crops: int,
    n_weeks: int
) -> dict:
    
    allocation = [[0.0] * n_weeks for _ in range(n_crops)]
    tank_levels = []
    current = tank_current_l

    for t in range(n_weeks):
        current += weekly_rainfall_l[t]
        current = min(current, tank_capacity)

        total_demand = sum(demand[i][t] for i in range(n_crops))
        available = current

        if total_demand <= 0:
            tank_levels.append(current)
            continue

        if available >= total_demand:
            for i in range(n_crops):
                allocation[i][t] = demand[i][t]
            current -= total_demand
        else:
            for i in range(n_crops):
                share = demand[i][t] / total_demand
                allocation[i][t] = available * share
            current = 0.0

        tank_levels.append(current)

    return {
        "status": "naive",
        "allocation": allocation,
        "tank_levels": tank_levels
    }