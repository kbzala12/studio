
import { Telegraf, Markup } from 'telegraf';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomBytes } from 'crypto';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured in .env file");
}

const bot = new Telegraf(botToken);

// Function to get the bot's username to create invite links
let botUsername = '';
bot.telegram.getMe().then(botInfo => {
    botUsername = botInfo.username;
});

const getWebAppKeyboard = () => {
    const webAppUrl = process.env.NEXT_PUBLIC_APP_URL;
     if (!webAppUrl) {
        console.error("NEXT_PUBLIC_APP_URL is not configured.");
        return Markup.inlineKeyboard([]);
    }
    const inviteLink = `https://t.me/${botUsername}?start=invite`;
    return Markup.inlineKeyboard([
        [Markup.button.webApp("Web open", webAppUrl)],
        [Markup.button.url("Invite", inviteLink)]
    ]);
};


bot.start(async (ctx) => {
    // Only respond in private chats
    if (ctx.chat.type !== 'private') {
        return;
    }

    const from = ctx.from;
    const telegramId = from.id.toString();
    const name = from.username || `${from.first_name}${from.last_name ? ' ' + from.last_name : ''}`;

    try {
        const db = await getDb();
        let user = await db.get('SELECT * FROM users WHERE telegramId = ?', telegramId);
        
        const keyboard = getWebAppKeyboard();

        if (user) {
            // User exists
            return ctx.reply(`Welcome back, ${user.name}! You can use the web app or invite others.`, keyboard);
        } else {
            // User does not exist, create a new one
            const userId = randomBytes(16).toString('hex');
            const password = randomBytes(4).toString('hex'); // Create a simple random password

            // Check if username already exists
            const existingUserByName = await db.get('SELECT * FROM users WHERE name = ?', name);
            if(existingUserByName) {
                 return ctx.reply(`Welcome! A user with the name "${name}" already exists. Please login on the web app with your existing account.`, keyboard);
            }
            
            await db.run(
                'INSERT INTO users (id, name, password, coins, isAdmin, telegramId) VALUES (?, ?, ?, ?, ?, ?)',
                userId,
                name,
                password,
                0, // Initial coins
                false, // isAdmin
                telegramId
            );

            await ctx.reply(`Welcome to my KB YT bot! We've created an account for you.`, { parse_mode: 'HTML' });
            await ctx.reply(`Your password is: <code>${password}</code>\n\nPlease keep it safe. You can use this to log in on the web.`, { parse_mode: 'HTML' });
            return ctx.reply('You can now open the web app or invite others.', keyboard);
        }

    } catch (error) {
        console.error('Error during /start command:', error);
        return ctx.reply('Sorry, something went wrong. Please try again later.');
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
