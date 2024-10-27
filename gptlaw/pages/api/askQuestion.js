import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAj47-IYQSlu-2dTbMXbZ8xVeSIQNmMfqk"; // Replace with your actual API key

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { topic } = req.body; // Remove numQuestions

        try {
            const prompt = `As an expert in Indian law, provide a detailed explanation about the topic "${topic}" in approximately 150-260 words.`;
            const result = await model.generateContent(prompt);
            const response = result.response.text(); // Use 'response' to match front-end

            res.status(200).json({ response }); // Send 'response' back
        } catch (error) {
            console.error("Error generating content:", error);
            res.status(500).json({ error: "Failed to generate response" });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
