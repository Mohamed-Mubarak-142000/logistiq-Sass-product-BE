import mongoose, { Model, Document } from 'mongoose';

export abstract class BaseRepository<T extends Document> {
    public model: Model<T>;

    constructor(model: Model<T>) {
        this.model = model;
    }

    async create(data: any): Promise<T> {
        return await this.model.create(data);
    }

    async find(query: any, options: any = {}): Promise<T[]> {
        const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
        return await this.model.find(query).sort(sort).skip(skip).limit(limit);
    }

    async findOne(query: any): Promise<T | null> {
        return await this.model.findOne(query);
    }

    async update(id: string, data: any): Promise<T | null> {
        return await this.model.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id: string): Promise<T | null> {
        return await this.model.findByIdAndDelete(id);
    }

    async count(query: any): Promise<number> {
        return await this.model.countDocuments(query);
    }
}
