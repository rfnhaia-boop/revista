/**
 * v1 pública é "sem dinheiro": marketplace, apoio, rodadas de financiamento e
 * conteúdo pago ficam desligados. Para ligar (após parecer jurídico + PSP): FEATURE_MONEY=1.
 */
export const moneyEnabled = () => process.env.FEATURE_MONEY === "1";
