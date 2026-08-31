import { corsHeaders } from '../_shared/cors.ts';

interface WithdrawalPayload {
  walletType: string;
  accountName: string;
  accountNumber: string;
  amount: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: WithdrawalPayload = await req.json();

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

    if (!botToken || !chatId) {
      console.log('Telegram not configured — skipping notification');
      return new Response(JSON.stringify({ ok: true, message: 'Telegram not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const tanggal = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const nominal = 'Rp' + body.amount.toLocaleString('id-ID');

    const message = [
      '===============',
      '      MINERINDO',
      '===============',
      `Walet: ${body.walletType}`,
      `Nama: ${body.accountName}`,
      `Nomor: ${body.accountNumber}`,
      `Nominal: ${nominal}`,
      `Tanggal: ${tanggal}`,
      '===============',
    ].join('\n');

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();
    console.log('Telegram response:', JSON.stringify(result));

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-telegram error:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
