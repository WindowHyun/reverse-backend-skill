const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_KEY);

async function charge({ amount, currency }) {
  return stripe.paymentIntents.create({
    amount,
    currency,
    confirm: true,
    payment_method: "pm_card_visa",
  });
}

module.exports = { charge };
