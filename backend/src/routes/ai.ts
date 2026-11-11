import { Router } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { asyncHandler, validate } from '../utils/http';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimit';
import { aiChatSchema } from '../validators/schemas';
import { encryptText, decryptText } from '../utils/crypto';
import { audit } from '../utils/audit';
import { logger } from '../utils/logger';
import { NotFoundError } from '../utils/errors';

export const aiRouter = Router();

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

const SYSTEM_PROMPT = `You are Naya, the AI wellness companion for Nayacura, a confidential sexual wellness and relationship healthcare platform for adults in India.

IDENTITY AND BOUNDARIES — non-negotiable:
- You are an AI assistant, not a doctor, therapist, nurse or emergency responder. Say so when relevant.
- Never diagnose any condition, interpret a test, prescribe or recommend prescription medication, or guarantee any outcome.
- Never claim to have examined the user or access to their records.
- Do not provide explicit sexual content, erotic role-play, instructions for harmful practices, or content involving minors.
- Do not invent statistics, studies, credentials, clinic details or referrals.
- Recommend a qualified professional for personal medical concerns. For emergencies, clearly tell the user to contact local emergency services; in India mention Tele-MANAS 14416 for mental health crisis support.
- If the user mentions self-harm, suicide, overdose, severe chest pain, heavy bleeding or immediate danger: stop general discussion and prioritise emergency guidance.
- Be sex-positive, nonjudgmental, inclusive and trauma-informed. Use plain language. Respect consent, privacy and diverse relationships.
- You may give general evidence-informed education and communication suggestions. Distinguish general information from individual medical advice.
- Ask at most one gentle clarifying question; do not overwhelm. Keep answers concise (roughly 120-220 words unless the user asks for more detail).
- Do not ask for identifying information or clinical documents.
- If asked about booking, explain that users can browse specialists, choose video or in-person, select a time and pay securely.
- If the user writes in Tamil, answer in Tamil. Otherwise answer in English.
- End with a short, grounded next step, not a sales pitch.
- Every response must be appropriate for a healthcare platform.`;

const emergencyTerms = [
  'suicide',
  'kill myself',
  'end my life',
  "don't want to live",
  'self harm',
  'self-harm',
  'overdose',
  'chest pain',
  'heavy bleeding',
  'severe bleeding',
  'unconscious',
  'தற்கொலை',
  'உயிரை மாய்த்து',
  'நெஞ்சு வலி',
  'அதிக இரத்தம்',
];

function isEmergency(message: string) {
  const normalized = message.toLowerCase();
  return emergencyTerms.some((term) => normalized.includes(term));
}

function emergencyResponse(language: string) {
  if (language === 'ta') {
    return `நான் நயா, ஒரு AI உதவியாளர் — மருத்துவர் அல்ல. நீங்கள் சொல்வது அவசரமாக இருக்கலாம். தயவுசெய்து இப்போதே உள்ளூர் அவசர சேவையை (இந்தியாவில் 112) அழைக்கவும் அல்லது அருகிலுள்ள அவசர மருத்துவமனைக்குச் செல்லவும். மனநல நெருக்கடிக்கு Tele-MANAS 14416 என்ற எண்ணில் உதவி கிடைக்கும். தனியாக இருக்க வேண்டாம் — நம்பகமான ஒருவரை அருகில் அழையுங்கள். இந்த உரையாடல் அவசர சிகிச்சைக்கு மாற்றல்ல.`;
  }
  return `I'm Naya, an AI assistant — not a doctor. What you have described may be an emergency. Please contact your local emergency service now (112 in India) or go to the nearest emergency department. For mental health crisis support in India, Tele-MANAS is available on 14416. If you can, stay with a trusted person and do not remain alone. This chat cannot provide emergency care.`;
}

function fallbackReply(message: string, language: 'en' | 'ta') {
  const lower = message.toLowerCase();
  const ta = language === 'ta';

  if (/book|appointment|slot|consult|பதிவு|நேரம்|ஆலோசனை/.test(lower)) {
    return ta
      ? `நயா ஆலோசனை பதிவு செய்வது எளிது: முதலில் உங்களுக்கு உதவக்கூடிய நிபுணரைத் தேர்ந்தெடுக்கவும், பின்னர் வீடியோ அல்லது நேரடி ஆலோசனையைத் தேர்வு செய்யவும். கிடைக்கும் நேரங்கள் மருத்துவரின் அட்டவணையிலிருந்து காட்டப்படும்; பணம் செலுத்திய பிறகே நேரம் உறுதி செய்யப்படும். மருத்துவரிடம் சொல்ல விரும்பாத தகவல்களைப் பகிர வேண்டியதில்லை. நான் AI — மருத்துவர் அல்ல; தனிப்பட்ட மருத்துவ ஆலோசனைக்கு தகுதியான நிபுணரை அணுகவும்.`
      : `Booking is designed to be straightforward: choose a specialist, select video or in-person care, then pick an available time. The slot is confirmed only after secure payment. You decide how much to share in the consultation, and you can pause or decline any question. You can browse the directory without an account. I'm Naya, an AI assistant — not a doctor; for personal medical advice, please consult a qualified professional.`;
  }

  if (/pain|hurt|discomfort|வலி|அசௌகரியம்/.test(lower)) {
    return ta
      ? `உடலுறவின் போது தொடரும் வலி அல்லது அசௌகரியம் அலட்சியப்படுத்தப்படக்கூடாது. இது உலர்வு, ஹார்மோன் மாற்றங்கள், தொற்று, இடுப்புத் தசை பதற்றம் அல்லது பிற காரணிகளால் ஏற்படலாம்; ஒரு மருத்துவர் மதிப்பீடு தேவை. வலியைப் பொறுத்துக்கொள்ள வேண்டாம். மகளிர் நலவாழ்வு அல்லது பாலியல் மருத்துவ நிபுணரை அணுகவும். திடீர் கடுமையான வலி அல்லது அதிக இரத்தப்போக்கு இருந்தால் அவசர சிகிச்சையை நாடுங்கள். நான் AI — நோயறிதல் செய்ய முடியாது.`
      : `Persistent pain or discomfort during intimacy deserves a proper assessment rather than endurance. Possible contributors include dryness, hormonal changes, infection, pelvic-floor tension or other conditions — but only a qualified clinician can assess your situation. A gynaecology or sexual-medicine consultation is a reasonable starting point. If pain is sudden and severe or accompanied by heavy bleeding, seek urgent care. I'm Naya, an AI — I can't diagnose you.`;
  }

  if (/anxiety|anxious|worry|nervous|பதற்றம்|கவலை/.test(lower)) {
    return ta
      ? `உடலுறவு குறித்த பதற்றம் மிகவும் பொதுவானது. அது உடல் மற்றும் உணர்வு நிலைகள் இரண்டிலும் தாக்கத்தை ஏற்படுத்தலாம். மூச்சை மெதுவாக்குதல், எதிர்பார்ப்பு இல்லாத அன்பான தொடுதல், இடைவேளை எடுத்தல் ஆகியவை சிறிய உதவிகளாக இருக்கலாம். பதற்றம் தொடர்ந்து உங்கள் வாழ்க்கையை பாதித்தால், பாலியல் உளவியல் சிகிச்சை நிபுணர் அல்லது மனநல நிபுணரை அணுகவும். நான் AI — மருத்துவர் அல்ல.`
      : `Anxiety around intimacy is common and can affect both body and mind. Small things that can help include slowing your breathing, non-sexual affection without expectation, pauses, and naming the anxiety to a trusted partner. If worry is persistent, affects sleep or daily life, or comes with panic, a psychosexual therapist or mental health professional can help. I'm Naya, an AI — not a doctor — and this is general information, not a diagnosis.`;
  }

  if (/desire|libido|interest|விருப்பம்|ஆசை/.test(lower)) {
    return ta
      ? `பாலியல் விருப்பம் ஒவ்வொருவருக்கும் மாறுபடும்; மன அழுத்தம், தூக்கம், உறவு பாதுகாப்பு, மருந்துகள் மற்றும் உடல்நிலை ஆகியவை அதை பாதிக்கலாம். "சாதாரண" அளவு என்று ஒன்று இல்லை. மாற்றம் உங்களை கவலைப்படுத்தினால், பாலியல் மருத்துவர் அல்லது உளவியல் நிபுணரிடம் பேசலாம். நான் AI — நோயறிதல் அல்லது சிகிச்சை பரிந்துரை செய்ய முடியாது.`
      : `Desire varies widely and changes with stress, sleep, medication, health, relationship safety and life stage. There is no universal "normal" frequency. If a change is persistent, distressing to you, or affecting your relationship, a sexual-medicine clinician or therapist can help you understand the context. You don't need to arrive with a diagnosis. I'm Naya, an AI — not a doctor.`;
  }

  if (/relationship|partner|couple|communication|உறவு|துணை|திருமணம்/.test(lower)) {
    return ta
      ? `உறவுச் சிக்கல்களில் பெரும்பாலும் மீண்டும் மீண்டும் வரும் ஒரு சுழற்சி இருக்கும்: ஒருவர் தேடுகிறார், மற்றவர் பின்வாங்குகிறார். குற்றம் சாட்டாமல் "எனக்கு என்ன தேவை" என்பதைச் சொல்ல முயற்சிக்கலாம். நீண்டகால மோதல் அல்லது பாதுகாப்பின்மை இருந்தால், இணை ஆலோசனை உதவும். கட்டாயம், பயம் அல்லது வன்முறை இருந்தால் தனிநபர் பாதுகாப்பு ஆதரவை நாடுங்கள். நான் AI — மருத்துவர் அல்ல.`
      : `Relationship difficulties often follow a cycle: one person pursues, the other withdraws, and both feel alone. A useful first step can be talking outside a heated moment and naming the need underneath the complaint ("I need to feel heard") rather than the verdict ("you never listen"). If conflict is persistent, or if there is fear, coercion or violence, seek individual safety support rather than joint counselling. I'm Naya, an AI — not a therapist.`;
  }

  if (/doctor|specialist|which|எந்த|நிபுணர்/.test(lower)) {
    return ta
      ? `உங்கள் கவலைக்கு ஏற்ப நிபுணரைத் தேர்ந்தெடுக்கலாம்: உடல் அறிகுறிகள், வலி அல்லது மருந்து தொடர்பான கேள்விகளுக்கு பாலியல் மருத்துவர் அல்லது மகளிர் நல மருத்துவர்; பதற்றம், உறவு அல்லது உணர்வு சார்ந்த கவலைகளுக்கு உளவியல் அல்லது இணை ஆலோசகர். நயாவின் நிபுணர் பட்டியலில் மொழி, பாலினம், ஆலோசனை வகை ஆகியவற்றால் வடிகட்டலாம். நான் AI — தனிப்பட்ட நோயறிதல் செய்ய முடியாது.`
      : `The right starting point depends on the concern. For physical symptoms such as pain, erection changes or medication questions, consider a sexual-medicine clinician, gynaecologist or urologist. For anxiety, shame, communication or relationship patterns, a psychosexual therapist, psychologist or couples counsellor may fit better. You can filter the directory by language, gender, specialisation and consultation type. I'm Naya, an AI — not a doctor — so this is navigation guidance, not a diagnosis.`;
  }

  return ta
    ? `நான் நயா, நயாகுராவின் AI நலவாழ்வு துணை. பாலியல் நலவாழ்வு, உறவு தொடர்பு, ஆலோசனை செயல்முறை அல்லது சரியான நிபுணரைத் தேர்ந்தெடுப்பது குறித்த பொதுவான தகவல்களை வழங்க முடியும். தயவுசெய்து உங்கள் கேள்வியை இன்னும் சற்று விரிவாகச் சொல்லுங்கள். நான் மருத்துவர் அல்ல; நோயறிதல், மருந்து பரிந்துரை அல்லது சிகிச்சை உறுதிமொழி வழங்க முடியாது. அவசரமானால் உள்ளூர் அவசர சேவையை அழைக்கவும்.`
    : `I'm Naya, Nayacura's AI wellness companion. I can share general information about sexual wellbeing, relationship communication, how consultations work, or finding the right kind of specialist. Could you tell me a little more about what you'd like help understanding? I'm not a doctor, so I can't diagnose, prescribe or promise an outcome. If this is urgent, please contact local emergency services.`;
}

function sse(res: import('express').Response, payload: unknown) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function streamFallback(
  res: import('express').Response,
  text: string,
  language: 'en' | 'ta',
) {
  const words = text.split(/(\s+)/);
  for (const word of words) {
    if (res.writableEnded) break;
    sse(res, { type: 'token', token: word });
    if (word.trim()) await sleep(22);
  }
  sse(res, { type: 'done', mode: 'demo-fallback', language });
}

async function streamLlm(
  res: import('express').Response,
  messages: ChatMessage[],
  language: 'en' | 'ta',
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  const base = env.LLM_BASE_URL.replace(/\/$/, '');
  try {
    const upstream = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.LLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.LLM_MODEL,
        stream: true,
        temperature: 0.35,
        max_tokens: 700,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      }),
      signal: controller.signal,
    });
    if (!upstream.ok || !upstream.body) {
      throw new Error(`LLM upstream returned ${upstream.status}`);
    }
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content;
          if (typeof token === 'string' && token) {
            full += token;
            sse(res, { type: 'token', token });
          }
        } catch {
          /* ignore malformed upstream chunk */
        }
      }
    }
    sse(res, { type: 'done', mode: 'llm', language });
    return full;
  } finally {
    clearTimeout(timeout);
  }
}

aiRouter.post(
  '/chat',
  aiLimiter,
  optionalAuth,
  validate(aiChatSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as {
      message: string;
      conversationId?: string | null;
      language: 'en' | 'ta';
      consent: boolean;
    };

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    if (isEmergency(body.message)) {
      sse(res, { type: 'meta', conversationId: null, stored: false, mode: 'safety' });
      await streamFallback(res, emergencyResponse(body.language), body.language);
      return res.end();
    }

    const shouldStore = Boolean(req.user && body.consent);
    let conversationId: string | null = null;
    let userMessageContent = body.message;

    if (shouldStore && req.user) {
      if (body.conversationId) {
        const existing = await prisma.aIConversation.findFirst({
          where: { id: body.conversationId, userId: req.user.id, deletedAt: null },
        });
        if (existing) conversationId = existing.id;
      }
      if (!conversationId) {
        const conversation = await prisma.aIConversation.create({
          data: {
            userId: req.user.id,
            // Never store a summary of the user's message as a plaintext title.
            title:
              body.language === 'ta'
                ? `நலவாழ்வு உரையாடல் · ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                : `Wellness conversation · ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
            language: body.language,
            consentGrantedAt: new Date(),
          },
        });
        conversationId = conversation.id;
        await prisma.consentRecord.create({
          data: {
            userId: req.user.id,
            type: 'AI_CONVERSATION_STORAGE',
            granted: true,
            version: 'draft-2026-11',
          },
        });
        await prisma.patientProfile.updateMany({
          where: { userId: req.user.id },
          data: { aiHistoryEnabled: true },
        });
      }
      await prisma.chatMessage.create({
        data: {
          conversationId,
          role: 'user',
          encryptedContent: encryptText(body.message),
        },
      });
    }

    sse(res, {
      type: 'meta',
      conversationId,
      stored: shouldStore,
      mode: env.llmConfigured ? 'llm' : 'demo-fallback',
    });

    let history: ChatMessage[] = [];
    if (conversationId) {
      const stored = await prisma.chatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        take: 16,
      });
      history = stored.map((message) => ({
        role: message.role === 'user' ? 'user' : 'assistant',
        content: decryptText(message.encryptedContent),
      }));
    } else {
      history = [{ role: 'user', content: body.message }];
    }

    let assistantText = '';
    try {
      if (env.llmConfigured) {
        assistantText = await streamLlm(res, history, body.language);
      } else {
        assistantText = fallbackReply(body.message, body.language);
        await streamFallback(res, assistantText, body.language);
      }
    } catch (error) {
      logger.warn('AI generation failed; using safe fallback', {
        error: error instanceof Error ? error.message : String(error),
      });
      if (!res.writableEnded) {
        sse(res, {
          type: 'token',
          token:
            '\n\nI could not reach the AI model just now. I can still offer general guidance, but this is not a medical assessment. For a personal concern, please consult a qualified professional. If this is urgent, contact local emergency services.',
        });
        sse(res, { type: 'done', mode: 'error-fallback', language: body.language });
      }
      assistantText = '';
    }

    if (conversationId && assistantText.trim()) {
      try {
        await prisma.chatMessage.create({
          data: {
            conversationId,
            role: 'assistant',
            encryptedContent: encryptText(assistantText),
          },
        });
        await prisma.aIConversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
      } catch (error) {
        logger.warn('AI conversation persistence failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await audit({
      req,
      action: 'AI_MESSAGE_PROCESSED',
      entityType: 'AIConversation',
      entityId: conversationId,
      metadata: {
        stored: shouldStore,
        mode: env.llmConfigured ? 'llm' : 'demo-fallback',
        language: body.language,
        safetyIntervention: false,
      },
    });
    res.end();
  }),
);

aiRouter.get(
  '/conversations',
  requireAuth,
  asyncHandler(async (req, res) => {
    const conversations = await prisma.aIConversation.findMany({
      where: { userId: req.user!.id, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { messages: true } } },
      take: 50,
    });
    res.json({
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        language: conversation.language,
        messageCount: conversation._count.messages,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      })),
    });
  }),
);

aiRouter.get(
  '/conversations/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const conversation = await prisma.aIConversation.findFirst({
      where: { id: req.params.id, userId: req.user!.id, deletedAt: null },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) throw new NotFoundError('Conversation not found.');
    res.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        language: conversation.language,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      },
      messages: conversation.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: decryptText(message.encryptedContent),
        createdAt: message.createdAt.toISOString(),
      })),
    });
  }),
);

aiRouter.delete(
  '/conversations/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const conversation = await prisma.aIConversation.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!conversation) throw new NotFoundError('Conversation not found.');
    await prisma.aIConversation.delete({ where: { id: conversation.id } });
    await audit({
      req,
      action: 'AI_CONVERSATION_DELETED',
      entityType: 'AIConversation',
      entityId: conversation.id,
    });
    res.status(204).end();
  }),
);

aiRouter.delete(
  '/conversations',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await prisma.aIConversation.deleteMany({
      where: { userId: req.user!.id },
    });
    await audit({
      req,
      action: 'AI_CONVERSATIONS_DELETED_ALL',
      entityType: 'AIConversation',
      entityId: null,
      metadata: { count: result.count },
    });
    res.json({ message: `${result.count} conversation(s) deleted.` });
  }),
);
