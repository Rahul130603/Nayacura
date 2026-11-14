import { Router } from 'express';
import { z } from 'zod';
import { formLimiter } from '../middleware/rateLimit';
import { sendWelcomeEmail } from '../services/mailer';
import { AppError } from '../utils/errors';
import { asyncHandler, validate } from '../utils/http';

const welcomeSchema = z.object({ email: z.string().trim().max(254).email() });

export const newsletterRouter = Router();

newsletterRouter.post(
  '/welcome',
  formLimiter,
  validate(welcomeSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body as z.infer<typeof welcomeSchema>;
    const result = await sendWelcomeEmail(email);
    if (!result.delivered) {
      throw new AppError('We could not send the welcome email. Please try again later.', 503, 'WELCOME_EMAIL_UNAVAILABLE');
    }
    res.status(204).end();
  }),
);
