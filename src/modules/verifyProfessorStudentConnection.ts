import { queryAsync } from "./dbService";

export const verifyProfessorStudentConnection = async (
  professorId: number,
  alunoId: number,
): Promise<boolean> => {
  const rows = await queryAsync(
    `
      SELECT 1
      FROM user_conexoes
      WHERE professor_id = ?
        AND aluno_id = ?
        AND status = 'accepted'
      LIMIT 1
    `,
    [professorId, alunoId],
  );

  return rows.length > 0;
};
