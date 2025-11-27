
import { GoogleGenAI, Type } from '@google/genai';
import { LessonPlan, Slide } from '../types';

// According to the guidelines, initialize GoogleGenAI with an API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for the main activities within the lesson plan.
const mainAbilitySchema = {
  type: Type.OBJECT,
  properties: {
    learningObjective: { type: Type.STRING, description: "A specific learning objective for this part of the lesson. This corresponds to the first column, which also includes differentiation notes." },
    teacherStrategy: { type: Type.STRING, description: "The strategy the teacher will use." },
    studentActivity: { type: Type.STRING, description: "What the students will be doing." },
    assessment: { type: Type.STRING, description: "How learning will be assessed during this activity." },
    time: { type: Type.STRING, description: "Estimated time for the activity, e.g., '10 mins'." },
  },
  required: ['learningObjective', 'teacherStrategy', 'studentActivity', 'assessment', 'time'],
};

// Main schema for the entire lesson plan, matching the LessonPlan interface.
const lessonPlanSchema = {
  type: Type.OBJECT,
  properties: {
    academicYear: { type: Type.STRING, description: "The current academic year, e.g., '2024-2025'."},
    teacherName: { type: Type.STRING, description: "Leave this field as an empty string." },
    grade: { type: Type.STRING, description: "The grade level for this lesson." },
    // FIX: Corrected typo 'toLocaleDate milking' to 'toLocaleDateString'.
    date: { type: Type.STRING, description: `The current date in YYYY-MM-DD format. Today is ${new Date().toLocaleDateString('en-CA')}.` },
    day: { type: Type.STRING, description: "The day of the week. Leave this field as an empty string." },
    subject: { type: Type.STRING, description: "The subject of the lesson." },
    unit: { type: Type.STRING, description: "The unit or chapter the lesson belongs to." },
    lessonTitle: { type: Type.STRING, description: "A concise and engaging title for the lesson." },
    learningOutcomes: { type: Type.STRING, description: "A bulleted or numbered list of what students will be able to do by the end of the lesson. Use newline characters for separation." },
    mainResource: { type: Type.STRING, description: "The primary resource for the lesson, e.g., 'Textbook pages 45-50'." },
    supportingResources: { type: Type.STRING, description: "A list of any additional resources needed." },
    resources: {
      type: Type.OBJECT,
      properties: {
        smartBoard: { type: Type.BOOLEAN },
        worksheet: { type: Type.BOOLEAN },
        presentations: { type: Type.BOOLEAN },
        dataShow: { type: Type.BOOLEAN },
        photoAndCards: { type: Type.BOOLEAN },
        manipulative: { type: Type.BOOLEAN },
        otherResource: { type: Type.BOOLEAN },
        otherResourceText: { type: Type.STRING, description: "If other resources are needed, list them here and set otherResource to true. Otherwise, leave empty." },
      },
    },
    strategies: {
      type: Type.OBJECT,
      properties: {
        directTeaching: { type: Type.BOOLEAN },
        cooperativeLearning: { type: Type.BOOLEAN },
        problemSolving: { type: Type.BOOLEAN },
        discussion: { type: Type.BOOLEAN },
        learningStation: { type: Type.BOOLEAN },
        modeling: { type: Type.BOOLEAN },
        handsOnActivity: { type: Type.BOOLEAN },
        photo: { type: Type.BOOLEAN },
        software: { type: Type.BOOLEAN },
        brainstorming: { type: Type.BOOLEAN },
        rolePlay: { type: Type.BOOLEAN },
        otherStrategy: { type: Type.BOOLEAN },
        otherStrategyText: { type: Type.STRING, description: "If other strategies are used, list them here and set otherStrategy to true. Otherwise, leave empty." },
      },
    },
    starter: {
      type: Type.OBJECT,
      properties: {
        activity: { type: Type.STRING, description: "A brief, engaging activity to start the lesson." },
        time: { type: Type.STRING, description: "Estimated time for the starter activity, e.g., '5 mins'" },
      },
      required: ['activity', 'time'],
    },
    mainActivities: {
      type: Type.ARRAY,
      description: "A sequence of 2 to 4 main activities for the lesson.",
      items: mainAbilitySchema,
    },
    closure: { type: Type.STRING, description: "A brief activity to wrap up the lesson and check for understanding." },
    assignments: { type: Type.STRING, description: "Any homework or assignments for the students. Can be a brief description or a list of tasks." },
    nationalAndEducationalValues: { type: Type.STRING, description: "How the lesson promotes Qatari national identity and educational values. This field MUST explicitly connect the lesson topic to one or more of the following core values: إخاء (Brotherhood), أصيل (Authenticity), نفسك أمانة (Yourself is a trust/well-being), فطرة (Innate goodness/nature), and التبحر الآمن (Safe Exploration/Digital Citizenship). Combine the most relevant values into a cohesive paragraph." },
    integration: { type: Type.STRING, description: "How the lesson integrates with other subjects or branches of the same subject." },
    selfReflection: { type: Type.STRING, description: "Leave this field as an empty string. The teacher will fill this part." },
  },
  required: [
    'academicYear', 'teacherName', 'grade', 'date', 'day', 'subject', 'unit', 'lessonTitle', 'learningOutcomes',
    'mainResource', 'supportingResources', 'resources', 'strategies', 'starter', 'mainActivities',
    'closure', 'assignments', 'nationalAndEducationalValues', 'integration', 'selfReflection'
  ]
};

const slideSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The title of the slide. Should be concise." },
    content: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "The main content of the slide, presented as a list of bullet points. Keep points brief and clear for students."
    },
    speakerNotes: { type: Type.STRING, description: "Notes for the teacher. Include prompts, questions to ask, or key points to emphasize. This is not for the students to see." },
    imagePrompt: { type: Type.STRING, description: "A concise, descriptive prompt in ENGLISH for an AI image generator. This should visually represent the slide's content (e.g., 'A vibrant diagram of a plant cell with labels'). For title or Q&A slides where an image isn't needed, this MUST be an empty string." },
    duration: { type: Type.INTEGER, description: "The estimated duration for this specific slide/activity in minutes. Extract this from the 'time' field in the lesson plan (e.g., '10 mins' -> 10). If no time is specified, leave as 0." }
  },
  required: ['title', 'content', 'speakerNotes', 'imagePrompt'],
};

const presentationSchema = {
    type: Type.ARRAY,
    items: slideSchema,
};


/**
 * Generates a lesson plan using the Gemini API based on user inputs.
 * @param subject The subject of the lesson.
 * @param grade The grade level.
 * @param topic The specific topic of the lesson.
 * @param language The language for the lesson plan ('ar' or 'en').
 * @param lessonDuration The total duration of the lesson in minutes.
 * @param textbookContent Optional content from a textbook for more context.
 * @returns A promise that resolves to a LessonPlan object.
 */
export const generateLessonPlan = async (
  subject: string,
  grade: string,
  topic: string,
  language: 'ar' | 'en',
  lessonDuration: number,
  textbookContent: string
): Promise<LessonPlan> => {
  try {
    // Check for International Curriculum
    const isInternational = subject.includes('IGCSE') || subject.includes('AS Level') || subject.includes('A Level');
    let curriculumContext = "";
    
    if (isInternational) {
        curriculumContext = `
        *** CRITICAL CURRICULUM REQUIREMENT ***
        The subject specified is an International Qualification (${subject}). 
        You MUST generate the 'learningOutcomes' and lesson content to be fully compatible with **Cambridge Assessment International Education (CAIE)** or **Pearson Edexcel** syllabus specifications.
        - Use official syllabus terminology and standards for learning objectives.
        - Ensure content depth and rigor matches the specific level (IGCSE, AS, or A Level).
        - Activities should align with exam preparation standards for these boards.
        `;
    }

    // Dynamically adjust the core instruction based on whether textbook content is provided.
    const coreInstruction = textbookContent 
      ? `Based **exclusively** on the provided 'Relevant Textbook Content', create a detailed daily lesson plan. You must analyze the text to derive all lesson components, including learning outcomes, activities, and assessments. The user-provided 'Lesson Topic' should be used as the title of the lesson, but the actual substance and flow of the plan MUST originate from the textbook content.`
      : `Create a detailed daily lesson plan for the following topic, following the official Qatar Ministry of Education template structure.`;

    const prompt = `
      ${coreInstruction}
      ${curriculumContext}
      
      The output MUST be a valid JSON object that strictly adheres to the provided schema.
      The lesson plan content should be written in ${language === 'ar' ? 'Arabic' : 'English'}.
      
      Lesson Details:
      - Subject: ${subject}
      - Grade: ${grade}
      - Lesson Topic: ${topic}
      - Total Lesson Duration: ${lessonDuration} minutes
      ${textbookContent ? `- Relevant Textbook Content: """${textbookContent}"""` : ''}

      JSON Structure Instructions:
      - Fill in all fields of the JSON structure logically based on the lesson details.
      - For the 'nationalAndEducationalValues' field, you MUST thoughtfully connect the lesson topic to one or more of the following core Qatari values. Select the most relevant value(s) for the lesson and write a cohesive paragraph explaining the connection. The values are: إخاء (Brotherhood), أصيل (Authenticity), نفسك أمانة (Yourself is a trust/well-being), فطرة (Innate goodness/nature), and التبحر الآمن (Safe Exploration/Digital Citizenship). For example, a lesson on teamwork could connect to 'إخاء', a history lesson to 'أصيل', a health lesson to 'نفسك أمانة', a social studies lesson to 'فطرة', and a computer science lesson to 'التبحر الآمن'.
      - The sum of the time allocated for the 'starter' and all 'mainActivities' MUST equal the 'Total Lesson Duration' of ${lessonDuration} minutes.
      - For boolean fields in 'resources' and 'strategies', set to true if the resource/strategy is applicable and beneficial, otherwise false.
      - If you write text in 'otherResourceText', you MUST set 'otherResource' to true.
      - If you write text in 'otherStrategyText', you MUST set 'otherStrategy' to true.
      - 'mainActivities' should be an array of 2 to 4 distinct, sequential activities.
      - 'academicYear' should be set to '2024-2025'.
      - The 'teacherName' and 'day' fields must be empty strings.
      - The 'selfReflection' field must be an empty string, as it is for the teacher to fill out later.
      - Ensure the entire output is a single, valid JSON object without any surrounding text or markdown.
    `;

    // Use gemini-flash-lite-latest for low-latency JSON generation.
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: lessonPlanSchema,
      },
    });
    
    // The Gemini API returns a response object with a 'text' property containing the JSON string.
    const jsonString = response.text.trim();
    const lessonPlan: LessonPlan = JSON.parse(jsonString);

    // AI might not perfectly format the date, so we enforce it here as a fallback.
    if (!lessonPlan.date || !/^\d{4}-\d{2}-\d{2}$/.test(lessonPlan.date)) {
        // FIX: Corrected typo 'toLocaleDate milking' to 'toLocaleDateString'.
        lessonPlan.date = new Date().toLocaleDateString('en-CA');
    }
    
    return lessonPlan;

  } catch (error) {
    console.error('Error generating lesson plan:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    // Provide a user-friendly error message.
    throw new Error(`Failed to generate the lesson plan with AI. Please check your connection and try again. Details: ${errorMessage}`);
  }
};


/**
 * Generates a presentation slide deck from a lesson plan.
 * @param lessonPlan The lesson plan object.
 * @param language The language for the presentation ('ar' or 'en').
 * @returns A promise that resolves to an array of Slide objects.
 */
export const generatePresentationFromPlan = async (lessonPlan: LessonPlan, language: 'ar' | 'en'): Promise<Slide[]> => {
    try {
        // FIX: Wrapped prompt content in backticks to create a valid template literal string.
        const prompt = `
            Based on the provided lesson plan JSON, create a compelling and visually clear slide deck for a teacher to present on a smartboard.
            The output MUST be a valid JSON array of slide objects that strictly adheres to the provided schema.
            The entire presentation content must be in ${language === 'ar' ? 'Arabic' : 'English'}.

            Lesson Plan Details:
            ${JSON.stringify(lessonPlan, null, 2)}

            Instructions for Slide Generation:
            1.  **Title Slide:** Create an engaging title slide with the lesson title and the grade level.
            2.  **Learning Outcomes Slide:** Create a slide titled "${language === 'ar' ? 'أهداف التعلم' : 'Learning Outcomes'}". List the learning outcomes from the lesson plan as clear, student-friendly "${language === 'ar' ? 'سأكون قادراً على...' : 'I can...'}" statements.
            3.  **Starter/Warm-up Slide:** Create a slide for the starter activity. The title should be "${language === 'ar' ? 'التهيئة' : 'Starter'}". The content should clearly explain the activity for the students. IMPORTANT: Extract the numeric time (e.g. 5) from the '${lessonPlan.starter.time}' field and assign it to the 'duration' field of this slide.
            4.  **Main Activity Slides:** For EACH object in the 'mainActivities' array, create a dedicated slide. The title of each slide should be descriptive of the activity (e.g., "${language === 'ar' ? 'النشاط الأول: العصف الذهني' : 'Activity 1: Brainstorming'}"). The content should summarize the 'studentActivity' in a way that is easy for students to understand. IMPORTANT: Extract the numeric time (e.g. 10) from the activity's 'time' field and assign it to the 'duration' field of this slide.
            5.  **Closure Slide:** Create a slide for the closure activity. The title should be "${language === 'ar' ? 'الغلق الختامي' : 'Closure'}". Summarize the key takeaways or the final task.
            6.  **Q&A Slide:** Create a final slide titled "${language === 'ar' ? 'هل هناك أسئلة؟' : 'Questions?'}".
            7.  **Image Prompts:** This is a critical instruction. For each slide, you MUST generate a creative, descriptive prompt for an AI image generator in the 'imagePrompt' field. This prompt **MUST be in ENGLISH**, even if the rest of the presentation is in Arabic. For example, for an Arabic slide about "دورة الماء", a correct English prompt would be "The water cycle with arrows showing evaporation, condensation, and precipitation". This prompt is essential for the image generation to work correctly. For slides that don't need an image (like the Title or Q&A slide), the 'imagePrompt' MUST be an empty string.

            General Content Guidelines:
            -   Keep the text on each slide concise and use bullet points (the 'content' field must be an array of strings).
            -   The language should be appropriate for the specified grade level (${lessonPlan.grade}).
            -   'speakerNotes' should contain tips for the teacher, such as questions to ask, key points to emphasize, or instructions for managing the activity. This content is for the teacher, not the students.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: presentationSchema,
            },
        });

        const jsonString = response.text.trim();
        const presentation: Slide[] = JSON.parse(jsonString);

        return presentation;

    } catch (error) {
        console.error('Error generating presentation:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        throw new Error(`Failed to generate the presentation with AI. Details: ${errorMessage}`);
    }
};

/**
 * Generates a presentation slide deck from a topic and grade.
 * @param topic The topic of the presentation.
 * @param grade The grade level for the audience.
 * @param language The language for the presentation ('ar' | 'en').
 * @param slideCount The desired number of slides for the core content.
 * @returns A promise that resolves to an array of Slide objects.
 */
export const generatePresentationFromTopic = async (topic: string, grade: string, language: 'ar' | 'en', slideCount: number): Promise<Slide[]> => {
    try {
        const coreSlides = Math.max(1, slideCount - 4); // Ensure at least 1 core slide
        // FIX: Wrapped prompt content in backticks to create a valid template literal string.
        const prompt = `
            Create a comprehensive and visually clear slide deck for a teacher to present on a smartboard.
            The presentation is for students in '${grade}' and covers the topic: '${topic}'.
            The output MUST be a valid JSON array of slide objects that strictly adheres to the provided schema.
            The entire presentation content must be in ${language === 'ar' ? 'Arabic' : 'English'}.

            Instructions for Slide Generation:
            1.  **Title Slide:** Create an engaging title slide with the lesson topic and the grade level.
            2.  **Learning Objectives Slide:** Infer 2-3 key learning objectives for this topic and grade level. Create a slide titled "${language === 'ar' ? 'أهداف التعلم' : 'Learning Objectives'}". List the objectives as clear, student-friendly "${language === 'ar' ? 'سأكون قادراً على...' : 'I can...'}" statements.
            3.  **Introduction/Hook Slide:** Create a slide to introduce the topic and grab students' attention. This could be a question, a surprising fact, or a short activity. Title it "${language === 'ar' ? 'مقدمة' : 'Introduction'}".
            4.  **Core Content Slides (${coreSlides} slides):** Break down the main topic into logical sub-topics. Create exactly ${coreSlides} dedicated slides for each sub-topic with a clear title and bulleted content. This is the main body of the presentation.
            5.  **Activity/Example Slide:** Create a slide for a simple, interactive activity or a worked example to reinforce learning. Title it "${language === 'ar' ? 'نشاط تطبيقي' : 'Activity'}". Suggest a duration for this activity in the 'duration' field (e.g., 5-10 mins).
            6.  **Summary/Conclusion Slide:** Create a slide to summarize the key takeaways from the lesson. Title it "${language === 'ar' ? 'الملخص' : 'Summary'}".
            7.  **Q&A Slide:** Create a final slide titled "${language === 'ar' ? 'هل هناك أسئلة؟' : 'Questions?'}".
            8.  **Image Prompts:** This is a critical instruction. For each slide, you MUST generate a creative, descriptive prompt for an AI image generator in the 'imagePrompt' field. This prompt **MUST be in ENGLISH**, even if the rest of the presentation is in Arabic. For example, for an Arabic slide about "دورة الماء", a correct English prompt would be "The water cycle with arrows showing evaporation, condensation, and precipitation". This prompt is essential for the image generation to work correctly. For slides that don't need an image (like the Title or Q&A slide), the 'imagePrompt' MUST be an empty string.

            The total number of slides should be approximately ${slideCount}.

            General Content Guidelines:
            -   Keep the text on each slide concise and use bullet points (the 'content' field must be an array of strings).
            -   The language and complexity should be appropriate for the specified grade level (${grade}).
            -   'speakerNotes' for each slide should contain practical tips for the teacher, like discussion questions, key points to emphasize, or instructions for the activity.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: presentationSchema,
            },
        });

        const jsonString = response.text.trim();
        const presentation: Slide[] = JSON.parse(jsonString);

        return presentation;

    } catch (error) {
        console.error('Error generating presentation from topic:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        throw new Error(`Failed to generate the presentation with AI. Details: ${errorMessage}`);
    }
};

/**
 * Generates a presentation by summarizing user-provided text.
 * @param text The source text to summarize.
 * @param topic The title for the presentation.
 * @param grade The grade level for the audience.
 * @param language The language for the presentation ('ar' | 'en').
 * @param slideCount The desired number of slides.
 * @returns A promise that resolves to an array of Slide objects.
 */
export const generatePresentationFromText = async (text: string, topic: string, grade: string, language: 'ar' | 'en', slideCount: number): Promise<Slide[]> => {
    try {
        const coreSlides = Math.max(1, slideCount - 3);
        // FIX: Wrapped prompt content in backticks to create a valid template literal string.
        const prompt = `
            Analyze the following text and structure it into a compelling slide deck for a teacher to present on a smartboard.
            The presentation is for students in '${grade}' and should be titled '${topic}'.
            The output MUST be a valid JSON array of slide objects that strictly adheres to the provided schema.
            The entire presentation content must be in ${language === 'ar' ? 'Arabic' : 'English'}.

            Source Text to Summarize and Structure:
            """
            ${text}
            """

            Instructions for Slide Generation:
            1.  **Title Slide:** Create a title slide using the provided topic: '${topic}' and the grade level.
            2.  **Introduction/Summary Slide:** Create one slide that introduces the main ideas or provides an executive summary of the source text.
            3.  **Core Content Slides:** Identify the key themes or sections in the source text. Create approximately ${coreSlides} slides to detail these core concepts. Each slide should have a clear title and summarize a part of the text into bullet points.
            4.  **Conclusion Slide:** Create a slide to summarize the key takeaways from the text.
            5.  **Q&A Slide:** Create a final slide titled "${language === 'ar' ? 'هل هناك أسئلة؟' : 'Questions?'}".
            6.  **Image Prompts:** This is a critical instruction. For each slide, you MUST generate a creative, descriptive prompt for an AI image generator in the 'imagePrompt' field. This prompt **MUST be in ENGLISH**, even if the rest of the presentation is in Arabic. For example, for an Arabic slide about "دورة الماء", a correct English prompt would be "The water cycle with arrows showing evaporation, condensation, and precipitation". This prompt is essential for the image generation to work correctly. For slides that don't need an image (like the Title or Q&A slide), the 'imagePrompt' MUST be an empty string.

            General Content Guidelines:
            -   Base all slide content directly on the provided source text. Do not introduce new information.
            -   Keep the text on each slide concise and use bullet points.
            -   'speakerNotes' for each slide should contain practical tips for the teacher related to the summarized content.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: presentationSchema,
            },
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error('Error generating presentation from text:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        throw new Error(`Failed to generate the presentation from text with AI. Details: ${errorMessage}`);
    }
};

/**
 * Generates an image using the gemini-2.5-flash-image model.
 * @param prompt The text prompt for the image.
 * @param aspectRatio The desired aspect ratio for the image.
 * @returns A promise that resolves to a base64 data URL of the generated image.
 */
export const generateImage = async (prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
             // @ts-ignore
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio,
                },
            } as any,
        });

        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
            const parts = candidates[0].content?.parts;
            if (parts) {
                for (const part of parts) {
                    if (part.inlineData) {
                        const mimeType = part.inlineData.mimeType || 'image/png';
                        return `data:${mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
        }

        throw new Error('No image generated.');
    } catch (error) {
        console.error('Error generating image:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during image generation.';
        throw new Error(`Failed to generate image with AI. Details: ${errorMessage}`);
    }
};

/**
 * Regenerates the content for a single presentation slide.
 * @param slide The current slide object to be improved.
 * @param context Additional context like the overall topic and grade.
 * @returns A promise that resolves to a new, updated Slide object.
 */
export const regenerateSlide = async (slide: Slide, context: { topic: string, grade: string, language: 'ar' | 'en' }): Promise<Slide> => {
    try {
        // FIX: Wrapped prompt content in backticks to create a valid template literal string.
        const prompt = `
            Regenerate the content for the following presentation slide to make it more engaging and clear for students.
            The output MUST be a valid JSON object that strictly adheres to the provided single-slide schema.
            The language for the new content MUST be ${context.language === 'ar' ? 'Arabic' : 'English'}.

            Overall Presentation Context:
            - Topic: ${context.topic}
            - Grade: ${context.grade}

            Current Slide Content (to be improved):
            ${JSON.stringify(slide, null, 2)}

            Instructions:
            -   Review the current title, content, and speaker notes.
            -   Generate a new, improved version. You can rephrase, add more detail, or simplify the content as needed.
            -   The title can be changed if a better one is conceived.
            -   The new 'content' should be a list of clear, concise bullet points.
            -   The new 'speakerNotes' should provide practical guidance for the teacher.
            -   The 'imagePrompt' is a critical field. It MUST be a creative, descriptive prompt in ENGLISH for an AI image generator, even if the slide content is in Arabic. If an image isn't suitable, it MUST be an empty string.
            -   Ensure the JSON output is valid and matches the schema exactly.
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: slideSchema,
            },
        });

        const jsonString = response.text.trim();
        const newSlide: Slide = JSON.parse(jsonString);

        return newSlide;

    } catch (error) {
        console.error('Error regenerating slide:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        throw new Error(`Failed to regenerate the slide with AI. Details: ${errorMessage}`);
    }
};

/**
 * Generates a single new slide to be inserted between two existing slides.
 * @param previousSlide The slide that comes before the insertion point.
 * @param nextSlide The slide that comes after the insertion point.
 * @param context General context about the presentation.
 * @returns A promise that resolves to a new Slide object.
 */
export const generateInsertedSlide = async (
  previousSlide: Slide | null,
  nextSlide: Slide | null,
  context: { topic: string; grade: string; language: 'ar' | 'en' }
): Promise<Slide> => {
  try {
    // FIX: Wrapped prompt content in backticks to create a valid template literal string.
    const prompt = `
      You are an expert curriculum and presentation designer. Your task is to generate a single new slide that logically fits between a preceding and a following slide.
      The output MUST be a valid JSON object that strictly adheres to the provided single-slide schema.
      The language for the new content MUST be ${context.language === 'ar' ? 'Arabic' : 'English'}.

      Overall Presentation Context:
      - Topic: ${context.topic}
      - Grade: ${context.grade}

      Preceding Slide Content (the slide before the new one):
      ${previousSlide ? JSON.stringify(previousSlide, null, 2) : "This is the first slide."}

      Following Slide Content (the slide after the new one):
      ${nextSlide ? JSON.stringify(nextSlide, null, 2) : "This is the last slide."}

      Instructions:
      -   Create a new slide that serves as a smooth transition or logical continuation between the two provided slides.
      -   The new 'title' should be relevant and concise.
      -   The new 'content' should be a list of clear, concise bullet points.
      -   The new 'speakerNotes' should provide practical guidance for the teacher.
      -   The 'imagePrompt' is a critical field. It MUST be a creative, descriptive prompt in ENGLISH for an AI image generator, even if the slide content is in Arabic. If an image isn't suitable, it MUST be an empty string.
      -   Ensure the JSON output is valid and matches the schema exactly.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: slideSchema, // Reusing the existing single slide schema
      },
    });

    const jsonString = response.text.trim();
    const newSlide: Slide = JSON.parse(jsonString);

    return newSlide;

  } catch (error) {
    console.error('Error generating inserted slide:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(`Failed to generate the inserted slide with AI. Details: ${errorMessage}`);
  }
};

// Helper to convert Blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // The result includes the data URL prefix, which we need to remove
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Transcribes audio using the Gemini API.
 * @param audioBlob The audio data as a Blob.
 * @returns A promise that resolves to the transcribed text.
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    try {
        const audioBase64 = await blobToBase64(audioBlob);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: 'Transcribe the following audio recording verbatim. It may contain Arabic or English or both. Do not summarize, just output the spoken text.' },
                    {
                        inlineData: {
                            mimeType: audioBlob.type,
                            data: audioBase64,
                        },
                    },
                ],
            },
        });

        return response.text.trim();

    } catch (error) {
        console.error('Error transcribing audio:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during audio transcription.';
        throw new Error(`Failed to transcribe audio with AI. Details: ${errorMessage}`);
    }
};

/**
 * Extracts text from an image using the Gemini API.
 * This is optimized for Arabic and mixed-language OCR.
 * @param base64Image The base64 encoded image string.
 * @param mimeType The mime type of the image (default: image/png).
 * @returns A promise that resolves to the extracted text.
 */
export const extractTextFromImage = async (base64Image: string, mimeType: string = 'image/png'): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { 
                        text: "OCR Task: Extract all text from this image exactly as it appears. The text may be in Arabic or English. Preserve the original layout and line breaks where possible. Do not provide any description or summary, just the raw text." 
                    },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Image,
                        },
                    },
                ],
            },
        });

        return response.text.trim();
    } catch (error) {
        console.error('Error extracting text via AI:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown AI Error';
        throw new Error(`AI Text Extraction Failed: ${errorMessage}`);
    }
};

/**
 * Analyzes an image based on a user prompt using the Gemini API.
 * @param imageFile The image file to analyze.
 * @param prompt The prompt for the analysis.
 * @returns A promise that resolves to the analysis text.
 */
export const analyzeImage = async (imageFile: File, prompt: string): Promise<string> => {
    try {
        const base64 = await blobToBase64(imageFile);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: imageFile.type,
                            data: base64,
                        },
                    },
                ],
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error('Error analyzing image:', error);
        throw new Error('Failed to analyze image');
    }
};


/**
 * Refines text content based on a user instruction (e.g., "Simplify", "Make it fun").
 * @param text The current text to refine.
 * @param instruction The instruction for the AI (e.g., "Rewrite for clarity").
 * @param context The context of the lesson (subject, grade, topic).
 * @returns A promise that resolves to the refined text.
 */
export const refineText = async (text: string, instruction: string, context: { subject: string, grade: string, topic: string, lang: 'ar' | 'en' }): Promise<string> => {
    try {
        const prompt = `
            You are an expert educational content editor. Your task is to rewrite the provided text segment from a lesson plan based on the user's instruction.
            
            Lesson Context:
            - Subject: ${context.subject}
            - Grade: ${context.grade}
            - Topic: ${context.topic}
            
            Original Text:
            """
            ${text}
            """
            
            Instruction for Rewrite:
            "${instruction}"
            
            Output Requirements:
            - Return ONLY the rewritten text. Do not add quotes, explanations, or conversational filler.
            - Ensure the tone is appropriate for the grade level.
            - The language MUST be ${context.lang === 'ar' ? 'Arabic' : 'English'}.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
        });

        return response.text.trim();

    } catch (error) {
        console.error('Error refining text:', error);
        throw new Error('Failed to refine text.');
    }
};
