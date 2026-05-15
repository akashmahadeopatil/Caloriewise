exports.handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json"
    };
    if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
    if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) return { statusCode: 500, headers, body: JSON.stringify({ error: "API key not configured." }) };

        const { imageBase64, mimeType } = JSON.parse(event.body);
        if (!imageBase64) return { statusCode: 400, headers, body: JSON.stringify({ error: "No image provided." }) };

        const prompt = `You are a world-class nutritionist AI for CalorieWise. Analyze this food image and respond in this EXACT format:

**🍽️ Food Identified:** [List all food items]

**🔥 Estimated Total Calories:** [X] kcal

**📊 Macronutrient Breakdown:**
• 🥩 Protein: [X]g
• 🍞 Carbohydrates: [X]g
• 🥑 Fat: [X]g
• 🥬 Fiber: [X]g
• 🍬 Sugar (approx): [X]g

**⭐ Health Rating:** [X]/10 — [reason]

**✅ Health Benefits:**
• [Benefit 1]
• [Benefit 2]
• [Benefit 3]

**⚠️ Watch Out For:**
• [Concern 1]
• [Concern 2]

**🔄 Healthier Alternatives:**
• [Swap 1 with calorie savings]
• [Swap 2 with calorie savings]

**⏰ Best Time to Eat:** [recommendation]

**💡 Pro Tip:** [one actionable tip]

Be specific with numbers.`;

        const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType || "image/jpeg", data: imageBase64 } }] }],
                generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
            })
        });

        const data = await res.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return { statusCode: 200, headers, body: JSON.stringify({ success: true, analysis: data.candidates[0].content.parts[0].text }) };
        }
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Could not analyze. Try a clearer photo." }) };
    } catch (e) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Server error: " + e.message }) };
    }
};
