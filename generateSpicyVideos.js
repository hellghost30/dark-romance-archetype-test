// generateSpicyVideos.js (v28 - правильний шлях до motionMP4URL)
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const API_KEY = "c979f5cd-23f1-487a-b3d7-6efef5b6f3cd";
const spicyPrompts = require('./src/data/spicy_prompts.json');
const VIDEOS_FOLDER = path.join(__dirname, 'public', 'videos', 'archetypes');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateVideoFromText(archetype) {
  const { id, name, positive_prompt } = archetype;
  
  console.log(`[1/4] Запитую Text-to-Video (MOTION 2.0) для Архетипу #${id}: ${name}`);

  try {
    const motionResponse = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations-text-to-video', {
        method: 'POST',
        headers: { 'accept': 'application/json', 'content-type': 'application/json', 'authorization': `Bearer ${API_KEY}` },
        body: JSON.stringify({
            prompt: positive_prompt,
            model: 'MOTION2',
            height: 1024,
            width: 832,
            duration: 4,
            isPublic: false
        })
    });

    const motionJob = await motionResponse.json();
    const generationId = motionJob.motionVideoGenerationJob?.generationId;
    if (!generationId) { throw new Error(`Помилка старту генерації відео: ${JSON.stringify(motionJob)}`); }
    
    console.log(`[2/4] Завдання на відео створено (ID: ${generationId}). Чекаю...`);
    
    let videoUrl = null;
    for (let i = 0; i < 40; i++) {
        await sleep(6000);
        const checkResponse = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, { headers: { 'authorization': `Bearer ${API_KEY}` } });
        const jobStatus = await checkResponse.json();
        const generationData = jobStatus.generations_by_pk;
        
        // !!! ОСЬ ФІНАЛЬНЕ ВИПРАВЛЕННЯ !!!
        if (generationData?.status === 'COMPLETE' && generationData?.generated_images?.length > 0) {
            videoUrl = generationData.generated_images[0].motionMP4URL;
            if (videoUrl) break;
        }
        if (generationData?.status === 'FAILED') { throw new Error(`Генерація відео не вдалася!`); }
    }
    if (!videoUrl) { throw new Error("Час очікування відео вичерпано."); }

    console.log(`[3/4] Відео готове. Завантажую...`);
    const videoResponse = await fetch(videoUrl);
    const buffer = await videoResponse.buffer();
    const filename = `spicy_archetype_${id}.mp4`;
    fs.writeFileSync(path.join(VIDEOS_FOLDER, filename), buffer);
    console.log(`[4/4] ✅ Відео ${filename} збережено!`);

  } catch (error) {
    console.error(`❌ Помилка під час генерації для #${id}: ${error.message}. Пропускаю.`);
  }
}

async function run() {
  if (!fs.existsSync(VIDEOS_FOLDER)) fs.mkdirSync(VIDEOS_FOLDER, { recursive: true });
  for (const archetype of spicyPrompts) {
    const filename = `spicy_archetype_${archetype.id}.mp4`;
    if (!fs.existsSync(path.join(VIDEOS_FOLDER, filename))) {
      await generateVideoFromText(archetype);
      await sleep(3000);
    } else {
      console.log(`- Відео для архетипу #${archetype.id} вже існує, пропускаю.`);
    }
  }
  console.log('🎉🎉🎉 Генерація SPICY відео (Text-to-Video) завершена! 🎉🎉🎉');
}

run();