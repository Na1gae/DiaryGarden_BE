export const EMOTION_ANALYSIS_PROMPT = `
Analyze the emotion of the following diary entry.
Return the result in strict JSON format with the following structure:
{
  "emotionScores": {
    "happy": number,
    "sad": number,
    "angry": number,
    "calm": number
  },
  "dominantEmotion": string,
  "aiComment": string
}

The "emotionScores" should be a map of emotion names to their intensity scores (between 0.0 and 1.0).
The "dominantEmotion" should be the name of the emotion with the highest score.
The "aiComment" should be a warm, empathetic, and supportive comment (2-3 sentences) based on the diary content and the analyzed emotion. It should be written in Korean.
Ensure the JSON is valid and does not contain any markdown formatting or additional text.

Diary Title: {title}
Diary Content: {content}
`;

export const DIARY_COMMENT_PROMPT = `
Based on the following diary entry and its analyzed emotion, write a warm, empathetic, and supportive comment.
The comment should be 2-3 sentences in Korean, acknowledging the writer's feelings and providing gentle encouragement or validation.

Diary Title: {title}
Diary Content: {content}
Dominant Emotion: {dominantEmotion}

Return ONLY the comment text in Korean, without any JSON formatting or additional explanation.
`;
