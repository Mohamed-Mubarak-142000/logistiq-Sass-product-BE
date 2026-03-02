import Store, { IStore } from '../models/Store';
import { BaseRepository } from './baseRepository';

class StoreRepository extends BaseRepository<IStore> {
    constructor() {
        super(Store);
    }
}

export const storeRepository = new StoreRepository();
