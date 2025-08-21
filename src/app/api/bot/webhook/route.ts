
import { Telegraf, Markup } from 'telegraf';
import { NextResponse } from 'next/server';

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
    
    const keyboard = getWebAppKeyboard();
    return ctx.reply(`Welcome to my KB YT bot! You can use the web app or invite others.`, keyboard);
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
