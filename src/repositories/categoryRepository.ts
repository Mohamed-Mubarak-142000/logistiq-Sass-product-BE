import Category, { ICategory } from '../models/Category';
import { BaseRepository } from './baseRepository';

export class CategoryRepository extends BaseRepository<ICategory> {
    constructor() {
        super(Category);
    }
}

export const categoryRepository = new CategoryRepository();
