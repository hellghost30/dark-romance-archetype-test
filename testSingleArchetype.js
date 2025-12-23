// testSingleArchetype.js (Виправлена версія для PhotoReal)
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// ================== НАЛАШТУВАННЯ ТЕСТУ ==================
const API_KEY = "c979f5cd-23f1-487a-b3d7-6efef5b6f3cd"; // !!! ВАЖЛИВО !!!
const ARCHETYPE_ID_TO_TEST = 64; // Тестуємо Ремо Фальконе

const archetypes = require('./src/data/archetypes.json');
const OUTPUT_FOLDER = path.join(__dirname, 'public', 'images', 'archetypes');
// =======================================================

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateTestImage() {
  const archetypeToTest = archetypes.find(a => a.id === ARCHETYPE_ID_TO_TEST);
  if (!archetypeToTest) {
    console.error(`❌ Архетип з ID ${ARCHETYPE_ID_TO_TEST} не знайдено!`);
    return;
  }

  const prompt = archetypeToTest.visual_prompt;
  console.log(`[1/4] Запитую PhotoReal генерацію для Архетипу #${ARCHETYPE_ID_TO_TEST}: ${archetypeToTest.name}`);

  const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      prompt: prompt,
      // !!! ВИДАЛЕНО 'modelId' !!! Це було причиною помилки.
      height: 960,
      width: 608,
      photoReal: true,
      alchemy: true,
      presetStyle: 'CINEMATIC',
      num_images: 4 
    })
  });

  const generationJob = await response.json();
  const generationId = generationJob.sdGenerationJob?.generationId;

  if (!generationId) {
    console.error("❌ Не вдалося почати генерацію. Перевір API ключ або налаштування. Відповідь:", generationJob);
    return;
  }
  
  console.log(`[2/4] Завдання створено (ID: ${generationId}). Чекаю на результат...`);

  let generatedImages = [];
  for (let i = 0; i < 20; i++) {
    await sleep(5000);
    const checkResponse = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
      headers: { 'authorization': `Bearer ${API_KEY}` }
    });
    const jobStatus = await checkResponse.json();
    
    const generationData = jobStatus.generations_by_pk;
    if (generationData?.status === 'COMPLETE') {
      generatedImages = generationData.generated_images;
      break; 
    } else if (generationData?.status === 'FAILED') {
      console.error("❌ Генерація не вдалася!");
      return;
    }
  }

  if (generatedImages.length === 0) {
    console.error("❌ Час очікування вичерпано або не знайдено зображень.");
    return;
  }

  console.log(`[3/4] Отримано ${generatedImages.length} зображень. Завантажую...`);

  if (!fs.existsSync(OUTPUT_FOLDER)) {
    fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
  }

  for (let i = 0; i < generatedImages.length; i++) {
    const imageUrl = generatedImages[i].url;
    const filename = `archetype_${ARCHETYPE_ID_TO_TEST}(${i + 1}).png`;
    
    const imageResponse = await fetch(imageUrl);
    const buffer = await imageResponse.buffer();
    fs.writeFileSync(path.join(OUTPUT_FOLDER, filename), buffer);
    console.log(`[4/4] ✅ Зображення ${filename} збережено!`);
  }
  
  console.log('🎉 Тестова генерація завершена!');
}

generateTestImage();