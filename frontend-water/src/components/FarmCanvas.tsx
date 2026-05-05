import { useRef } from 'react'
import React from 'react'
import { Stage, Layer, Rect, Line, Text, Group } from 'react-konva'
import Konva from 'konva'
import type { ParcelGroup } from '../types'
import { CANVAS_W, CANVAS_H, getScale, getGroupCanvasDimensions } from '../types'

interface Props {
    groups: ParcelGroup[]
    selectedId: string | null
    farmWidthM: number
    farmHeightM: number
    onSelect: (id: string | null) => void
    onMove: (id: string, x: number, y: number) => void
    onEdit: (group: ParcelGroup) => void
}

const CROP_COLORS: Record<number, string> = {
    1: '#ef4444',
    2: '#a855f7',
    3: '#22c55e',
    4: '#f97316',
    5: '#84cc16',
}

export default function FarmCanvas({
    groups,
    selectedId,
    farmWidthM,
    farmHeightM,
    onSelect,
    onMove,
    onEdit,
}: Props) {
    const stageRef = useRef<Konva.Stage>(null)    

    // Uniform scale — preserves real proportions 1:1
    const { scaleX: scale } = getScale(farmWidthM, farmHeightM)

    // Farm boundary in canvas pixels — centered in canvas
    const farmCanvasW = farmWidthM * scale
    const farmCanvasH = farmHeightM * scale
    const farmOriginX = (CANVAS_W - farmCanvasW) / 2
    const farmOriginY = (CANVAS_H - farmCanvasH) / 2

    // Grid lines — capped at 20 divisions for readability
    const gridLinesX = Math.min(farmWidthM, 20)
    const gridLinesY = Math.min(farmHeightM, 20)
    const gridStepX = farmCanvasW / gridLinesX
    const gridStepY = farmCanvasH / gridLinesY

    const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.target === e.target.getStage()) onSelect(null)
    }

    const handleDragEnd = (
        group: ParcelGroup,
        e: Konva.KonvaEventObject<DragEvent>
    ) => {
        const { visualW, visualH } = getGroupCanvasDimensions(group, scale)
        const halfW = visualW / 2
        const halfH = visualH / 2

        const minX = farmOriginX + halfW
        const maxX = farmOriginX + farmCanvasW - halfW
        const minY = farmOriginY + halfH
        const maxY = farmOriginY + farmCanvasH - halfH

        // If parcel is wider/taller than farm, center it
        const clampedX =
            minX > maxX
                ? farmOriginX + farmCanvasW / 2
                : Math.max(minX, Math.min(maxX, e.target.x()))

        const clampedY =
            minY > maxY
                ? farmOriginY + farmCanvasH / 2
                : Math.max(minY, Math.min(maxY, e.target.y()))

        e.target.x(clampedX)
        e.target.y(clampedY)
        onMove(group.id, clampedX, clampedY)
    }

    return (
        <div
            style={{
                position: 'relative',
                border: '1.5px solid #e5e7eb',
                borderRadius: 12,
                overflow: 'hidden',
                background: '#f8faf8',
                width: '100%',
            }}
        >
            <Stage
                ref={stageRef}
                width={CANVAS_W}
                height={CANVAS_H}
                onClick={handleStageClick}
            >
                {/* Background + farm boundary */}
                <Layer>
                    <Rect
                        x={0} y={0}
                        width={CANVAS_W} height={CANVAS_H}
                        fill="#f8faf8"
                    />

                    {/* Farm boundary */}
                    <Rect
                        x={farmOriginX} y={farmOriginY}
                        width={farmCanvasW} height={farmCanvasH}
                        fill="#f0f7f0"
                        stroke="#4ade80"
                        strokeWidth={2}
                        dash={[8, 4]}
                        cornerRadius={4}
                    />

                    {/* Grid lines inside farm */}
                    {Array.from({ length: gridLinesX - 1 }, (_, i) => (
                        <Line
                            key={`gx${i}`}
                            points={[
                                farmOriginX + (i + 1) * gridStepX, farmOriginY,
                                farmOriginX + (i + 1) * gridStepX, farmOriginY + farmCanvasH,
                            ]}
                            stroke="#d1fae5"
                            strokeWidth={1}
                        />
                    ))}
                    {Array.from({ length: gridLinesY - 1 }, (_, i) => (
                        <Line
                            key={`gy${i}`}
                            points={[
                                farmOriginX, farmOriginY + (i + 1) * gridStepY,
                                farmOriginX + farmCanvasW, farmOriginY + (i + 1) * gridStepY,
                            ]}
                            stroke="#d1fae5"
                            strokeWidth={1}
                        />
                    ))}

                    {/* Dimension labels */}
                    <Text
                        x={farmOriginX}
                        y={farmOriginY + farmCanvasH + 10}
                        text={`← ${farmWidthM}m →`}
                        width={farmCanvasW}
                        align="center"
                        fontSize={11}
                        fill="#6b7280"
                    />
                    <Text
                        x={farmOriginX - 38}
                        y={farmOriginY}
                        text={`${farmHeightM}m`}
                        height={farmCanvasH}
                        verticalAlign="middle"
                        fontSize={11}
                        fill="#6b7280"
                    />
                </Layer>

                {/* Parcel groups */}
                <Layer>
                    {groups.map((group) => {
                        const { rectW, rectH } = getGroupCanvasDimensions(group, scale)
                        
                        const color =
                            group.cropId
                                ? CROP_COLORS[group.cropId] ?? '#6366f1'
                                : '#94a3b8'
                        const isSelected = group.id === selectedId

                        // Dividers — vertical lines in unrotated coordinate space
                        const dividers: number[][] = []
                        for (let i = 1; i < group.parcelCount; i++) {
                            const x = i * group.parcelWidth * scale - rectW / 2
                            dividers.push([x, -rectH / 2, x, rectH / 2])
                        }


                        return (
                            <Group
                                key={group.id}
                                id={group.id}
                                x={group.x}
                                y={group.y}
                                rotation={group.rotation}
                                draggable
                                onClick={() => onSelect(group.id)}
                                onTap={() => onSelect(group.id)}
                                onDblClick={() => onEdit(group)}
                                onDblTap={() => onEdit(group)}
                                onDragEnd={(e) => handleDragEnd(group, e)}
                            >
                                {/* Main rectangle — centered at group origin */}
                                <Rect
                                    x={-rectW / 2}
                                    y={-rectH / 2}
                                    width={rectW}
                                    height={rectH}
                                    fill={color + '30'}
                                    stroke={isSelected ? '#1a56db' : color}
                                    strokeWidth={isSelected ? 2.5 : 1.5}
                                    cornerRadius={3}
                                    shadowEnabled={isSelected}
                                    shadowColor="#1a56db"
                                    shadowBlur={8}
                                    shadowOpacity={0.2}
                                />

                                {/* Parcel dividers */}
                                {dividers.map((pts, i) => (
                                    <Line
                                        key={i}
                                        points={pts}
                                        stroke={color + '80'}
                                        strokeWidth={1}
                                        dash={[4, 3]}
                                    />
                                ))}

                            </Group>
                        )
                    })}
                </Layer>
                {/* Labels layer — outside rotated groups, always upright */}
                <Layer>
                    {groups.map((group) => {
                        const { rectW, rectH } = getGroupCanvasDimensions(group, scale)
                        const isVertical = group.rotation === 90
                        const visualW = isVertical ? rectH : rectW
                        const color = group.cropId
                            ? CROP_COLORS[group.cropId] ?? '#6366f1'
                            : '#94a3b8'
                        const fontSize = Math.min(14, visualW / 8)

                        return (
                            <React.Fragment key={group.id}>
                                <Text
                                    x={group.x - visualW / 2}
                                    y={group.y - fontSize - 2}
                                    width={visualW}
                                    align="center"
                                    text={group.cropName ?? 'Sin cultivo'}
                                    fontSize={fontSize}
                                    fontStyle="bold"
                                    fill={color}
                                    listening={false}
                                />
                                <Text
                                    x={group.x - visualW / 2}
                                    y={group.y + 4}
                                    width={visualW}
                                    align="center"
                                    text={`${group.parcelCount}×${group.parcelWidth}m×${group.parcelLength}m`}
                                    fontSize={Math.max(8, fontSize * 0.7)}
                                    fill={color + 'bb'}
                                    listening={false}
                                />
                            </React.Fragment>
                        )
                    })}
                </Layer>
            </Stage>
        </div>
    )
}