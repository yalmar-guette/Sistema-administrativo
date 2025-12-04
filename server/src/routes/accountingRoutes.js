import express from 'express';
import db, { dbGet, dbRun, dbAll } from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all accounts
router.get('/accounts', verifyToken, async (req, res) => {
    try {
        const accounts = await dbAll('SELECT * FROM accounts ORDER BY code');
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all transactions (libro diario)
router.get('/transactions', verifyToken, async (req, res) => {
    try {
        const transactions = await dbAll('SELECT * FROM transactions ORDER BY date DESC, id DESC');

        // For each transaction, get its entries
        const transactionsWithEntries = await Promise.all(
            transactions.map(async (trans) => {
                const entries = await dbAll(`
          SELECT te.*, a.code as account_code, a.name as account_name
          FROM transaction_entries te
          JOIN accounts a ON te.account_id = a.id
          WHERE te.transaction_id = ?
        `, [trans.id]);

                return {
                    ...trans,
                    entries
                };
            })
        );

        res.json(transactionsWithEntries);
    } catch (error) {
        console.error('Error loading transactions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create transaction
router.post('/transactions', verifyToken, async (req, res) => {
    const { date, description, reference, entries } = req.body;

    // Validate balanced entries
    const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return res.status(400).json({ error: 'Transaction must be balanced (debit = credit)' });
    }

    try {
        // Insert transaction
        const result = await dbRun(
            'INSERT INTO transactions (date, description, reference, created_by) VALUES (?, ?, ?, ?)',
            [date, description, reference, req.user.id]
        );

        const transactionId = result.lastID;

        // Insert entries and update account balances
        for (const entry of entries) {
            await dbRun(
                'INSERT INTO transaction_entries (transaction_id, account_id, debit, credit) VALUES (?, ?, ?, ?)',
                [transactionId, entry.account_id, entry.debit || 0, entry.credit || 0]
            );

            // Update account balance
            const account = await dbGet('SELECT type FROM accounts WHERE id = ?', [entry.account_id]);
            let balanceChange = (entry.debit || 0) - (entry.credit || 0);

            // For liability, equity, and revenue accounts, invert the change
            if (['liability', 'equity', 'revenue'].includes(account.type)) {
                balanceChange = -balanceChange;
            }

            await dbRun('UPDATE accounts SET balance = balance + ? WHERE id = ?', [balanceChange, entry.account_id]);
        }

        res.status(201).json({ message: 'Transaction created', id: transactionId });
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete transaction (admin/owner/superuser only)
router.delete('/transactions/:id', verifyToken, requireRole('admin', 'owner', 'superuser'), async (req, res) => {
    try {
        // Get entries before deleting to reverse balance changes
        const entries = await dbAll(`
      SELECT te.*, a.type
      FROM transaction_entries te
      JOIN accounts a ON te.account_id = a.id
      WHERE te.transaction_id = ?
    `, [req.params.id]);

        // Reverse balance changes
        for (const entry of entries) {
            let balanceChange = (entry.credit || 0) - (entry.debit || 0);
            if (['liability', 'equity', 'revenue'].includes(entry.type)) {
                balanceChange = -balanceChange;
            }
            await dbRun('UPDATE accounts SET balance = balance + ? WHERE id = ?', [balanceChange, entry.account_id]);
        }

        // Delete transaction entries first
        await dbRun('DELETE FROM transaction_entries WHERE transaction_id = ?', [req.params.id]);

        // Delete transaction
        await dbRun('DELETE FROM transactions WHERE id = ?', [req.params.id]);

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
