import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTreePositionDto } from './dto/update-tree-position.dto';
import { TreePositionResponseDto } from './dto/tree-position-response.dto';

@Injectable()
export class GardenService {
  constructor(private prisma: PrismaService) {}

  async getTreePositions(userId: string, gardenLevel: string): Promise<TreePositionResponseDto[]> {
    // 1. Validate and Parse gardenLevel
    let startDate: Date;
    let endDate: Date;

    if (/^\d{4}$/.test(gardenLevel)) {
      const year = parseInt(gardenLevel, 10);
      startDate = new Date(Date.UTC(year, 0, 1));
      endDate = new Date(Date.UTC(year + 1, 0, 1));
    } else if (/^\d{4}-\d{2}$/.test(gardenLevel)) {
      const [year, month] = gardenLevel.split('-').map(Number);
      startDate = new Date(Date.UTC(year, month - 1, 1));
      endDate = new Date(Date.UTC(year, month, 1));
    } else {
      throw new BadRequestException('gardenLevel 형식이 올바르지 않습니다.');
    }

    // 2. Find all trees that have diaries in this period
    const trees = await this.prisma.tree.findMany({
      where: {
        userId,
        diaries: {
          some: {
            writtenDate: {
              gte: startDate,
              lt: endDate,
            },
          },
        },
      },
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    if (trees.length === 0) {
      return [];
    }

    // 3. Get existing positions
    const existingPositions = await this.prisma.treePosition.findMany({
      where: {
        userId,
        gardenLevel,
        treeId: { in: trees.map((t) => t.id) },
      },
    });

    const positionMap = new Map(existingPositions.map((p) => [p.treeId, p]));

    // 4. Generate result with default positions for missing ones
    const result: TreePositionResponseDto[] = [];
    
    // Calculate grid based on TOTAL trees to ensure space for everyone
    const totalTrees = trees.length;
    const cols = Math.ceil(Math.sqrt(totalTrees));
    const rows = Math.ceil(totalTrees / cols);

    // Track occupied cells to avoid overlap
    const occupiedCells = new Set<string>();

    // First, process existing positions to mark occupied cells
    for (const tree of trees) {
      if (positionMap.has(tree.id)) {
        const pos = positionMap.get(tree.id);
        const x = pos.positionX.toNumber();
        const y = pos.positionY.toNumber();
        
        // Determine which cell this tree occupies
        // Clamp values to handle edge cases like 1.0
        const col = Math.min(Math.floor(x * cols), cols - 1);
        const row = Math.min(Math.floor(y * rows), rows - 1);
        
        occupiedCells.add(`${row},${col}`);
        
        result.push({
          gardenLevel: pos.gardenLevel,
          treeId: pos.treeId,
          positionX: x,
          positionY: y,
          updatedAt: pos.updatedAt.toISOString(),
        });
      }
    }

    // Next, place trees without positions into empty cells
    let searchIndex = 0;

    for (const tree of trees) {
      if (!positionMap.has(tree.id)) {
        // Find next available cell
        while (searchIndex < rows * cols) {
          const c = searchIndex % cols;
          const r = Math.floor(searchIndex / cols);
          if (!occupiedCells.has(`${r},${c}`)) {
            break;
          }
          searchIndex++;
        }

        // Calculate position for the found cell
        // If grid is full (shouldn't happen with correct sizing), it will use the last cell
        const targetCol = searchIndex % cols;
        const targetRow = Math.floor(searchIndex / cols);

        const positionX = (targetCol + 0.5) / cols;
        const positionY = (targetRow + 0.5) / rows;

        result.push({
          gardenLevel,
          treeId: tree.id,
          positionX,
          positionY,
          updatedAt: new Date().toISOString(),
        });
        
        // Move to next cell for next iteration
        searchIndex++;
      }
    }

    return result;
  }

  async updateTreePosition(
    userId: string,
    gardenLevel: string,
    treeId: string,
    updateDto: UpdateTreePositionDto,
  ): Promise<TreePositionResponseDto> {
    // Validate gardenLevel format
    if (!/^\d{4}(-\d{2})?$/.test(gardenLevel)) {
      throw new BadRequestException('gardenLevel 형식이 올바르지 않습니다.');
    }

    // Check if tree exists and belongs to user
    const tree = await this.prisma.tree.findFirst({
      where: {
        id: treeId,
        userId,
      },
    });

    if (!tree) {
      throw new NotFoundException('Tree를 찾을 수 없습니다.');
    }

    const position = await this.prisma.treePosition.upsert({
      where: {
        userId_gardenLevel_treeId: {
          userId,
          gardenLevel,
          treeId,
        },
      },
      update: {
        positionX: updateDto.positionX,
        positionY: updateDto.positionY,
      },
      create: {
        user: { connect: { id: userId } },
        gardenLevel,
        tree: { connect: { id: treeId } },
        positionX: updateDto.positionX,
        positionY: updateDto.positionY,
      },
    });

    return {
      gardenLevel: position.gardenLevel,
      treeId: position.treeId,
      positionX: position.positionX.toNumber(),
      positionY: position.positionY.toNumber(),
      updatedAt: position.updatedAt.toISOString(),
    };
  }
}
