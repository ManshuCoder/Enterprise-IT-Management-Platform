import { Router } from 'express';
import { getTickets, createTicket, updateTicket, addComment, escalateTicket } from '../controllers/ticketController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getTickets);
router.post('/', createTicket);
router.put('/:id', updateTicket);
router.post('/:id/comment', addComment);
router.post('/:id/escalate', escalateTicket);

export default router;
