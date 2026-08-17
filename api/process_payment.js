const crypto = require("crypto");

const CATALOG = {
  "Zona Style Shadow": 80,
  "Zona Style Graffiti": 80
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({ message: "MP_ACCESS_TOKEN não configurado no servidor." });
  }

  try {
    const { formData, cart } = req.body || {};
    if (!formData || !Array.isArray(cart) || !cart.length) {
      return res.status(400).json({ message: "Pedido inválido." });
    }

    // O servidor calcula o preço: não confia no total enviado pelo navegador.
    let total = 0;
    const descriptionParts = [];

    for (const item of cart) {
      const price = CATALOG[item.name];
      const qty = Math.max(1, Math.floor(Number(item.qty) || 0));
      if (!price || qty > 20) {
        return res.status(400).json({ message: "Produto ou quantidade inválida." });
      }
      total += price * qty;
      descriptionParts.push(`${item.name} x${qty}`);
    }

    const paymentBody = {
      ...formData,
      transaction_amount: Number(total.toFixed(2)),
      description: `Zona Style - ${descriptionParts.join(", ")}`,
      external_reference: `ZS-${Date.now()}`
    };

    // Alguns campos internos do Brick não devem ser enviados à API.
    delete paymentBody.transaction_details;

    const idempotencyKey = crypto.randomUUID();

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify(paymentBody)
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Mercado Pago:", data);
      return res.status(mpResponse.status).json({
        message: data.message || "Erro retornado pelo Mercado Pago",
        cause: data.cause || []
      });
    }

    // Retorna apenas os dados necessários para a tela.
    return res.status(200).json({
      id: data.id,
      status: data.status,
      status_detail: data.status_detail,
      payment_method_id: data.payment_method_id,
      point_of_interaction: data.point_of_interaction ? {
        transaction_data: data.point_of_interaction.transaction_data ? {
          qr_code: data.point_of_interaction.transaction_data.qr_code,
          qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
          ticket_url: data.point_of_interaction.transaction_data.ticket_url
        } : undefined
      } : undefined
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro interno ao processar pagamento." });
  }
};