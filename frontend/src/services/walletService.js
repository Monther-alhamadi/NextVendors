import api from "./api";

export async function getWallet() {
  const resp = await api.get("/wallet/balance");
  return resp.data;
}

export async function topUpWallet(amount, description = "Manual Top-up") {
  const resp = await api.post("/wallet/top-up", { amount, description });
  return resp.data;
}

export async function getWalletTransactions() {
  const data = await getWallet();
  return data.transactions || [];
}

export async function requestPayout(amount) {
    const resp = await api.post("/wallet/payout-request", { amount });
    return resp.data;
}
