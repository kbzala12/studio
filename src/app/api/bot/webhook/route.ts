
import { Telegraf, Markup } from 'telegraf';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import * as argon2 from 'argon2';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured in .env file");
}

const bot = new Telegraf(botToken);

const getWebAppKeyboard = () => {
    const webAppUrl = process.env.NEXT_PUBLIC_APP_URL;
     if (!webAppUrl) {
        console.error("NEXT_PUBLIC_APP_URL is not configured.");
        return Markup.inlineKeyboard([]);
    }
    const authUrl = `${webAppUrl}/auth/telegram`;
    return Markup.inlineKeyboard([
        [Markup.button.webApp("Web open", authUrl)],
    ]);
};


bot.start(async (ctx) => {
    // Only respond in private chats
    if (ctx.chat.type !== 'private') {
        return;
    }

    const keyboard = getWebAppKeyboard();
    const telegramUser = ctx.from;

    if (!telegramUser) {
        return ctx.reply('Could not identify you. Please try again.');
    }

    const db = await getDb();
    try {
        const existingUser = await db.get('SELECT * FROM users WHERE telegramId = ?', telegramUser.id.toString());
        
        if (existingUser) {
             return ctx.reply(`Welcome back, ${telegramUser.first_name}! Click below to open the app.`, keyboard);
        } else {
            // User does not exist, create a new one
            const userId = telegramUser.id.toString(); // Use Telegram ID as the primary ID
            const name = telegramUser.username || `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim();
            // We don't need a password, but the DB schema requires one. Store a placeholder.
            const placeholderPassword = await argon2.hash(`tg_${telegramUser.id}_${Date.now()}`);

            await db.run(
                'INSERT INTO users (id, name, password, telegramId, isAdmin) VALUES (?, ?, ?, ?, ?)',
                userId,
                name,
                placeholderPassword,
                telegramUser.id.toString(),
                false // Default to not admin
            );
            return ctx.reply(`Welcome, ${telegramUser.first_name}! Your account has been created. Click below to open the app.`, keyboard);
        }

    } catch (error) {
        console.error("Error during /start command:", error);
        return ctx.reply('An error occurred. Please try again later.');
    }
});


// This is the webhook handler.
const handleUpdate = async (req: Request) => {
    try {
        const body = await req.json();
        await bot.handleUpdate(body);
        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Error handling update:', error);
        return NextResponse.json({ status: 'error' }, { status: 500 });
    }
};

export async function POST(req: Request) {
    return handleUpdate(req);
}

export async function GET() {
    // You need to set the webhook for your bot to use this endpoint.
    // You can do this by visiting the URL:
    // https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_DEPLOYED_APP_URL>/api/bot/webhook
    return NextResponse.json({ message: "Set your webhook to this URL." });
}
