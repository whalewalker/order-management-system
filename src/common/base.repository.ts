import { Repository, DeepPartial, FindManyOptions } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PaginatedResponse, PaginationParams } from '../types/common.types';

export abstract class BaseRepository<T> {
  constructor(
    protected readonly repository: Repository<T>,
    protected readonly entityName: string,
  ) {}

  async create(entity: DeepPartial<T>): Promise<T> {
    const newEntity = this.repository.create(entity);
    return await this.repository.save(newEntity);
  }

  async findById(id: string): Promise<T> {
    const entity = await this.repository.findOne({ where: { id } as any });
    if (!entity) {
      throw new NotFoundException(`${this.entityName} not found`);
    }
    return entity;
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return await this.repository.find(options);
  }

  async paginate(
    params: PaginationParams,
    options?: FindManyOptions<T>,
  ): Promise<PaginatedResponse<T>> {
    const [items, total] = await this.repository.findAndCount({
      ...options,
      skip: ((params.page || 1) - 1) * (params.limit || 10),
      take: params.limit || 10,
    });

    return {
      items,
      total,
      page: params.page || 1,
      limit: params.limit || 10,
    };
  }

  async update(id: string, updateData: DeepPartial<T>): Promise<T> {
    await this.repository.update(id, updateData as any);
    return await this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`${this.entityName} not found`);
    }
  }
}
