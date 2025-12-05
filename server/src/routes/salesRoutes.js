import express from 'express';
import { dbGet, dbRun, dbAll } from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all sales (filtered by inventory)
router.get('/', verifyToken, async (req, res) => {
    try {
        const inventoryId = req.headers['x-inventory-id'];

        if (!inventoryId) {
            return res.status(400).json({ error: 'Debe seleccionar un inventario' });
        }

        const sales = await dbAll(
            'SELECT * FROM sales WHERE inventory_id = ? ORDER BY created_at DESC',
            [inventoryId]
        );

        // For each sale, get its items
        const salesWithItems = await Promise.all(
            sales.map(async (sale) => {
                const items = await dbAll('SELECT * FROM sale_items WHERE sale_id = ?', [sale.id]);
                return { ...sale, items };
            })
        );

        res.json(salesWithItems);
    } catch (error) {
        console.error('Error loading sales:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Register new sale
router.post('/', verifyToken, async (req, res) => {
    const { customer_name, payment_method, items, exchange_rate } = req.body;

    if (!payment_method || !items || items.length === 0) {
        return res.status(400).json({ error: 'Invalid sale data' });
    }

    const inventoryId = req.headers['x-inventory-id'];
    if (!inventoryId) {
        return res.status(400).json({ error: 'Debe seleccionar un inventario' });
    }

    try {
        // Generate sale number (per inventory)
        const lastSale = await dbGet(
            'SELECT sale_number FROM sales WHERE inventory_id = ? ORDER BY id DESC LIMIT 1',
            [inventoryId]
        );
        let saleNumber = 'V-0001';
        if (lastSale) {
            const lastNumber = parseInt(lastSale.sale_number.split('-')[1]);
            saleNumber = `V-${String(lastNumber + 1).padStart(4, '0')}`;
        }

        // Calculate totals
        let totalUsd = 0;
        let totalBs = 0;

        for (const item of items) {
            totalUsd += item.subtotal_usd;
            totalBs += item.subtotal_bs;
        }

        // Create sale with inventory_id
        const saleResult = await dbRun(
            `INSERT INTO sales (sale_number, date, customer_name, payment_method, total_usd, total_bs, exchange_rate_used, inventory_id, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [saleNumber, new Date().toISOString().split('T')[0], customer_name || '', payment_method, totalUsd, totalBs, exchange_rate, inventoryId, req.user.id]
        );

        const saleId = saleResult.insertId;

        // Insert sale items and update product quantities
        for (const item of items) {
            await dbRun(
                `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price_usd, unit_price_bs, subtotal_usd, subtotal_bs)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [saleId, item.product_id, item.product_name, item.quantity, item.unit_price_usd, item.unit_price_bs, item.subtotal_usd, item.subtotal_bs]
            );

            // Reduce product quantity
            await dbRun(
                'UPDATE products SET quantity = quantity - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        res.status(201).json({
            message: 'Sale registered successfully',
            sale_number: saleNumber,
            sale_id: saleId
        });
    } catch (error) {
        console.error('Error creating sale:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete/Cancel sale (admin/owner/superuser only)
router.delete('/:id', verifyToken, requireRole('admin', 'owner', 'superuser'), async (req, res) => {
    try {
        // Get sale items to restore inventory
        const items = await dbAll('SELECT * FROM sale_items WHERE sale_id = ?', [req.params.id]);

        // Restore product quantities
        for (const item of items) {
            await dbRun(
                'UPDATE products SET quantity = quantity + ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // Delete sale (cascade will delete items)
        await dbRun('DELETE FROM sales WHERE id = ?', [req.params.id]);

        res.json({ message: 'Sale cancelled and inventory restored' });
    } catch (error) {
        console.error('Error deleting sale:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get daily report
router.get('/daily-report', verifyToken, requireRole('admin', 'owner', 'superuser'), async (req, res) => {
    const { date } = req.query;
    const reportDate = date || new Date().toISOString().split('T')[0];

    try {
        // Get all sales for the date
        const sales = await dbAll('SELECT * FROM sales WHERE date = ?', [reportDate]);

        // Get all sale items for these sales
        const saleIds = sales.map(s => s.id);
        let allItems = [];
        if (saleIds.length > 0) {
            // Use parameterized query for safety
            const placeholders = saleIds.map(() => '?').join(',');
            allItems = await dbAll(`SELECT * FROM sale_items WHERE sale_id IN (${placeholders})`, saleIds);
        }

        // Group by product
        const productStats = {};
        for (const item of allItems) {
            if (!productStats[item.product_name]) {
                productStats[item.product_name] = {
                    name: item.product_name,
                    sold: 0,
                    revenue_usd: 0,
                    revenue_bs: 0
                };
            }
            productStats[item.product_name].sold += item.quantity;
            productStats[item.product_name].revenue_usd += parseFloat(item.subtotal_usd);
            productStats[item.product_name].revenue_bs += parseFloat(item.subtotal_bs);
        }

        // Get current stock for each product
        const products = Object.values(productStats);
        for (const product of products) {
            const dbProduct = await dbGet('SELECT quantity FROM products WHERE name = ?', [product.name]);
            product.final_stock = dbProduct ? dbProduct.quantity : 0;
            product.initial_stock = product.final_stock + product.sold;
        }

        // Group by payment method
        const paymentMethods = {};
        for (const sale of sales) {
            if (!paymentMethods[sale.payment_method]) {
                paymentMethods[sale.payment_method] = {
                    usd: 0,
                    bs: 0,
                    count: 0
                };
            }
            paymentMethods[sale.payment_method].usd += parseFloat(sale.total_usd);
            paymentMethods[sale.payment_method].bs += parseFloat(sale.total_bs);
            paymentMethods[sale.payment_method].count += 1;
        }

        // Calculate totals
        const totals = {
            total_usd: sales.reduce((sum, s) => sum + parseFloat(s.total_usd), 0),
            total_bs: sales.reduce((sum, s) => sum + parseFloat(s.total_bs), 0),
            total_sales: sales.length
        };

        res.json({
            date: reportDate,
            products,
            payment_methods: paymentMethods,
            totals
        });
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
