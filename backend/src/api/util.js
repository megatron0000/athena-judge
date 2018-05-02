export function handleError(res, err) {
  console.error(err);
  res.status(500);
  res.json({ error: "InternalServerError", message: "Erro interno do servidor" });
}