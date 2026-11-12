def evaluate_answers(
    generated_mcqs: list[dict],
    submitted_answers: dict[int, str],
) -> dict:

    if not generated_mcqs:
        raise ValueError("No generated MCQs are available.")

    total_questions = len(generated_mcqs)

    for question_index in submitted_answers:
        if not isinstance(question_index, int):
            raise ValueError("Question indexes must be integers.")

        if question_index < 0 or question_index >= total_questions:
            raise ValueError(f"Invalid question index: {question_index}.")

    correct_answers = 0
    question_results = []

    for index, mcq in enumerate(generated_mcqs):
        correct_answer = mcq["correct_answer"]
        submitted_answer = submitted_answers.get(index)

        is_correct = submitted_answer == correct_answer

        if is_correct:
            correct_answers += 1

        question_results.append(
            {
                "question_index": index,
                "question": mcq["question"],
                "options": mcq["options"],
                "submitted_answer": submitted_answer,
                "correct_answer": correct_answer,
                "is_correct": is_correct,
                "explanation": mcq["explanation"],
            }
        )

    attempted_questions = len(submitted_answers)
    incorrect_answers = attempted_questions - correct_answers
    unattempted_questions = total_questions - attempted_questions

    score_percentage = round(
        (correct_answers / total_questions) * 100,
        2,
    )

    return {
        "total_questions": total_questions,
        "attempted_questions": attempted_questions,
        "correct_answers": correct_answers,
        "incorrect_answers": incorrect_answers,
        "unattempted_questions": unattempted_questions,
        "score_percentage": score_percentage,
        "question_results": question_results,
    }
