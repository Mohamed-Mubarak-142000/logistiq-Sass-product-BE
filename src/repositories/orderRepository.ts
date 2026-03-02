import Order, { IOrder } from '../models/Order';
import { BaseRepository } from './baseRepository';

class OrderRepository extends BaseRepository<IOrder> {
    constructor() {
        super(Order);
    }
}

export const orderRepository = new OrderRepository();
