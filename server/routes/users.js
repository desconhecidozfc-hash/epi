import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();
const db = getDb();
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-mude-isso';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// POST /api/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Senha deve ter pelo menos 8 caracteres' });
        }

        // Verifica email existente
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(409).json({ error: 'Email já registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const insert = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?) RETURNING id');
        const result = insert.run(name, email, hashedPassword);

        res.status(201).json({ 
            success: true, 
            message: 'Usuário criado com sucesso', 
            userId: result.lastInsertRowid 
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({ 
            success: true, 
            token, 
            user: { id: user.id, name: user.name, email: user.email } 
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/profile
router.get('/profile', authenticateToken, (req, res) => {
    try {
        const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json(user);
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Nome é obrigatório para atualização' });
        }

        const update = db.prepare('UPDATE users SET name = ? WHERE id = ?');
        update.run(name, req.user.id);

        res.json({ success: true, message: 'Perfil atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /api/profile
router.delete('/profile', authenticateToken, (req, res) => {
    try {
        db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
        res.json({ success: true, message: 'Conta excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/users
router.get('/users', authenticateToken, (req, res) => {
    try {
        const users = db.prepare('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC').all();
        res.json(users);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;