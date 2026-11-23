const noteStatuses = new Set(["nuevo", "repaso", "dominado"]);
const notebookColors = new Set(["violeta", "menta", "coral", "azul", "ambar", "rosa", "lila", "turquesa"]);
const codeLanguages = new Set(["javascript", "typescript", "python", "html", "css", "sql", "java", "csharp", "php", "bash", "json", "text"]);

export const emptyState = () => ({
  version: 1,
  notebooks: [],
  notes: [],
  codeSnippets: [],
  errors: [],
  flashcards: [],
  quizzes: [],
  quizResults: [],
  trash: [],
});

function normalizeTimestamp(value) {
  const timestamp = typeof value === "string" ? new Date(value) : new Date();
  return Number.isNaN(timestamp.getTime()) ? new Date().toISOString() : timestamp.toISOString();
}

function validText(value, maxLength, required = false) {
  return typeof value === "string" && value.length <= maxLength
    && (!required || Boolean(value.trim()));
}

function normalizeTags(value, maxItems = 20) {
  if (!Array.isArray(value) || value.length > maxItems
      || value.some((tag) => !validText(tag, 40, true))) return null;
  return value.map((tag) => tag.trim()).filter(Boolean);
}

function normalizeVersion(value) {
  if (!value || typeof value !== "object"
      || !validText(value.id, 80, true)
      || !validText(value.code, 200000)
      || !validText(value.createdAt, 64)) return null;
  return { id: value.id, code: value.code, createdAt: normalizeTimestamp(value.createdAt) };
}

export function validateState(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== 1) {
    return { error: "El formato de los datos no es compatible." };
  }
  if (!Array.isArray(value.notebooks) || !Array.isArray(value.notes)
      || value.notebooks.length > 250 || value.notes.length > 10000) {
    return { error: "La cantidad de cuadernos o apuntes supera el límite permitido." };
  }

  const notebookIds = new Set();
  const notebooks = [];
  for (const item of value.notebooks) {
    if (!item || typeof item !== "object"
        || !validText(item.id, 80, true) || item.id.length > 80
        || !validText(item.name, 80, true)
        || typeof item.color !== "string" || !notebookColors.has(item.color)
        || notebookIds.has(item.id)) {
      return { error: "Hay un cuaderno con datos no válidos." };
    }
    notebookIds.add(item.id);
    notebooks.push({
      id: item.id,
      name: item.name.trim(),
      color: item.color,
      createdAt: normalizeTimestamp(item.createdAt),
      updatedAt: normalizeTimestamp(item.updatedAt),
    });
  }

  const noteIds = new Set();
  const notes = [];
  for (const item of value.notes) {
    if (!item || typeof item !== "object"
        || !validText(item.id, 80, true) || noteIds.has(item.id)
        || typeof item.notebookId !== "string" || !notebookIds.has(item.notebookId)
        || !validText(item.title, 160, true)
        || !validText(item.bodyMd, 200000)
        || !noteStatuses.has(item.status)) {
      return { error: "Hay un apunte inválido o asociado a un cuaderno inexistente." };
    }
    const tags = Array.isArray(item.tags)
      ? item.tags.filter((tag) => typeof tag === "string").map((tag) => tag.trim().slice(0, 40)).filter(Boolean).slice(0, 12)
      : [];
    noteIds.add(item.id);
    notes.push({
      id: item.id,
      notebookId: item.notebookId,
      title: item.title.trim(),
      bodyMd: item.bodyMd,
      status: item.status,
      tags,
      createdAt: normalizeTimestamp(item.createdAt),
      updatedAt: normalizeTimestamp(item.updatedAt),
    });
  }

  const rawCollections = {
    codeSnippets: value.codeSnippets ?? [],
    errors: value.errors ?? [],
    flashcards: value.flashcards ?? [],
    quizzes: value.quizzes ?? [],
    quizResults: value.quizResults ?? [],
    trash: value.trash ?? [],
  };
  const limits = {
    codeSnippets: 500,
    errors: 2000,
    flashcards: 10000,
    quizzes: 500,
    quizResults: 10000,
    trash: 10000,
  };
  for (const [name, collection] of Object.entries(rawCollections)) {
    if (!Array.isArray(collection) || collection.length > limits[name]) {
      return { error: "La cantidad de códigos, errores o materiales de estudio supera el límite permitido." };
    }
  }

  const codeIds = new Set();
  const codeSnippets = [];
  for (const item of rawCollections.codeSnippets) {
    const tags = normalizeTags(item?.tags ?? []);
    const versions = item?.versions ?? [];
    if (!item || typeof item !== "object" || Array.isArray(item)
        || !validText(item.id, 80, true) || codeIds.has(item.id)
        || !validText(item.title, 160, true)
        || !validText(item.description ?? "", 2000)
        || !codeLanguages.has(item.language)
        || !validText(item.code, 200000)
        || !validText(item.category ?? "", 80)
        || !validText(item.topic ?? "", 80)
        || !validText(item.explanation ?? "", 20000)
        || !validText(item.comments ?? "", 12000)
        || !tags || !Array.isArray(versions) || versions.length > 30) {
      return { error: "Hay un fragmento de código con datos no válidos." };
    }
    const normalizedVersions = versions.map(normalizeVersion);
    if (normalizedVersions.some((version) => !version)) {
      return { error: "El historial de versiones contiene datos no válidos." };
    }
    codeIds.add(item.id);
    codeSnippets.push({
      id: item.id,
      title: item.title.trim(),
      description: item.description ?? "",
      language: item.language,
      code: item.code,
      category: (item.category ?? "").trim(),
      topic: (item.topic ?? "").trim(),
      tags,
      explanation: item.explanation ?? "",
      comments: item.comments ?? "",
      versions: normalizedVersions,
      createdAt: normalizeTimestamp(item.createdAt),
      updatedAt: normalizeTimestamp(item.updatedAt),
    });
  }

  const errorIds = new Set();
  const errors = [];
  for (const item of rawCollections.errors) {
    const tags = normalizeTags(item?.tags ?? []);
    if (!item || typeof item !== "object" || Array.isArray(item)
        || !validText(item.id, 80, true) || errorIds.has(item.id)
        || !validText(item.title, 160, true)
        || !validText(item.description ?? "", 8000)
        || !validText(item.code ?? "", 200000)
        || !validText(item.message ?? "", 8000)
        || !codeLanguages.has(item.language)
        || !validText(item.solution ?? "", 20000)
        || !validText(item.fixedCode ?? "", 200000)
        || !validText(item.category ?? "", 80)
        || !validText(item.topic ?? "", 80)
        || !tags || !["pending", "solved"].includes(item.status)
        || (item.sourceCodeId != null && !validText(item.sourceCodeId, 80))) {
      return { error: "Hay un registro de error con datos no válidos." };
    }
    errorIds.add(item.id);
    errors.push({
      id: item.id,
      title: item.title.trim(),
      description: item.description ?? "",
      code: item.code ?? "",
      message: item.message ?? "",
      language: item.language,
      solution: item.solution ?? "",
      fixedCode: item.fixedCode ?? "",
      category: (item.category ?? "").trim(),
      topic: (item.topic ?? "").trim(),
      tags,
      status: item.status,
      sourceCodeId: item.sourceCodeId ?? "",
      createdAt: normalizeTimestamp(item.createdAt),
      updatedAt: normalizeTimestamp(item.updatedAt),
    });
  }

  const flashcardIds = new Set();
  const flashcards = [];
  for (const item of rawCollections.flashcards) {
    if (!item || typeof item !== "object" || Array.isArray(item)
        || !validText(item.id, 80, true) || flashcardIds.has(item.id)
        || !validText(item.front, 4000, true)
        || !validText(item.back, 10000, true)
        || !validText(item.topic ?? "", 80)
        || !["new", "review", "known"].includes(item.status)
        || (item.sourceNoteId != null && !validText(item.sourceNoteId, 80))
        || (item.sourceSnippetId != null && !validText(item.sourceSnippetId, 80))) {
      return { error: "Hay una tarjeta de estudio con datos no válidos." };
    }
    flashcardIds.add(item.id);
    flashcards.push({
      id: item.id,
      front: item.front.trim(),
      back: item.back.trim(),
      topic: (item.topic ?? "").trim(),
      status: item.status,
      sourceNoteId: item.sourceNoteId ?? "",
      sourceSnippetId: item.sourceSnippetId ?? "",
      reviewedAt: item.reviewedAt ? normalizeTimestamp(item.reviewedAt) : "",
      createdAt: normalizeTimestamp(item.createdAt),
      updatedAt: normalizeTimestamp(item.updatedAt),
    });
  }

  const quizIds = new Set();
  const quizzes = [];
  for (const quiz of rawCollections.quizzes) {
    if (!quiz || typeof quiz !== "object" || Array.isArray(quiz)
        || !validText(quiz.id, 80, true) || quizIds.has(quiz.id)
        || !validText(quiz.title, 160, true)
        || !validText(quiz.topic ?? "", 80)
        || !Array.isArray(quiz.questions) || !quiz.questions.length || quiz.questions.length > 100) {
      return { error: "Hay un cuestionario con datos no válidos." };
    }
    const questionIds = new Set();
    const questions = [];
    for (const question of quiz.questions) {
      if (!question || typeof question !== "object" || Array.isArray(question)
          || !validText(question.id, 80, true) || questionIds.has(question.id)
          || !validText(question.prompt, 2000, true)
          || !["multiple", "true-false"].includes(question.type)
          || !Array.isArray(question.options) || question.options.length < 2 || question.options.length > 6
          || (question.type === "true-false" && question.options.length !== 2)
          || question.options.some((option) => !validText(option, 300, true))
          || !Number.isInteger(question.correctIndex) || question.correctIndex < 0
          || question.correctIndex >= question.options.length
          || !validText(question.explanation ?? "", 4000)) {
        return { error: "Una pregunta del cuestionario tiene datos no válidos." };
      }
      questionIds.add(question.id);
      questions.push({
        id: question.id,
        prompt: question.prompt.trim(),
        type: question.type,
        options: question.options.map((option) => option.trim()),
        correctIndex: question.correctIndex,
        explanation: question.explanation ?? "",
      });
    }
    quizIds.add(quiz.id);
    quizzes.push({
      id: quiz.id,
      title: quiz.title.trim(),
      topic: (quiz.topic ?? "").trim(),
      questions,
      createdAt: normalizeTimestamp(quiz.createdAt),
      updatedAt: normalizeTimestamp(quiz.updatedAt),
    });
  }

  const quizResults = [];
  const resultIds = new Set();
  for (const item of rawCollections.quizResults) {
    if (!item || typeof item !== "object" || Array.isArray(item)
        || !validText(item.id, 80, true) || resultIds.has(item.id)
        || !validText(item.quizId, 80, true)
        || !Number.isInteger(item.score) || !Number.isInteger(item.total)
        || item.score < 0 || item.total < 1 || item.score > item.total
        || !Array.isArray(item.answers) || item.answers.length !== item.total
        || item.answers.some((answer) => !Number.isInteger(answer) || answer < -1 || answer > 5)) {
      return { error: "Hay un resultado de cuestionario con datos no válidos." };
    }
    resultIds.add(item.id);
    quizResults.push({
      id: item.id,
      quizId: item.quizId,
      score: item.score,
      total: item.total,
      answers: item.answers,
      completedAt: normalizeTimestamp(item.completedAt),
    });
  }

  const trash = [];
  const trashIds = new Set();
  for (const entry of rawCollections.trash) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)
        || !validText(entry.id, 80, true) || trashIds.has(entry.id)
        || !["note", "code", "error", "notebook"].includes(entry.kind)
        || !entry.item || typeof entry.item !== "object" || Array.isArray(entry.item)
        || !validText(entry.item.id, 80, true)) {
      return { error: "Hay un elemento de la papelera con datos no válidos." };
    }
    trashIds.add(entry.id);
    trash.push({
      id: entry.id,
      kind: entry.kind,
      item: entry.item,
      deletedAt: normalizeTimestamp(entry.deletedAt),
    });
  }

  return {
    state: {
      version: 1,
      notebooks,
      notes,
      codeSnippets,
      errors,
      flashcards,
      quizzes,
      quizResults,
      trash,
    },
  };
}
