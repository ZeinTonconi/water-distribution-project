import { Box, Card, CardActionArea, CardContent, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { FarmSummary } from "../types";

interface cardFarmSummaryProps {
    farm: FarmSummary
}

export const CardFarmSummary = ({farm}: cardFarmSummaryProps) => {

    const navigate = useNavigate()

  return (
    <Card key={farm.id} elevation={1}>
      <CardActionArea onClick={() => navigate(`/farms/${farm.id}`)}>
        <CardContent>
          <Typography fontWeight={700} fontSize="1rem">
            {farm.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={1}>
            📍 {farm.municipality.name}
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Typography
              variant="caption"
              bgcolor="primary.light"
              color="primary.dark"
              px={1}
              py={0.25}
              borderRadius={1}
            >
              🌱 {farm.activeCrops} cultivos
            </Typography>
            <Typography
              variant="caption"
              bgcolor="grey.100"
              color="text.secondary"
              px={1}
              py={0.25}
              borderRadius={1}
            >
              💧 {farm.tankCapacity}L
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
