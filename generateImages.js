// generateImages.js (Фінальна версія - 4 картинки для архетипів)

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// ================== НАЛАШТУВАННЯ ==================
const API_KEY = "c979f5cd-23f1-487a-b3d7-6efef5b6f3cd"; // Твій ключ на місці
const archetypes = require('./src/data/archetypes.json');
const questions = require('./src/data/questions.json');
    
const QUESTIONS_IMG_FOLDER = path.join(__dirname, 'public', 'images', 'questions');
const ARCHETYPES_IMG_FOLDER = path.join(__dirname, 'public', 'images', 'archetypes');
// =======================================================

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Функція для генерації ОДНІЄЇ картинки (для питань)
async function generateSingleImage(prompt, outputFolderPath, outputFilename) {
  // (Ця функція залишається без змін, вона працює коректно)
  console.log(`[1/3] Запитую PhotoReal генерацію для: ${outputFilename}`);
  
  const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
    method: 'POST',
    headers: { 'accept': 'application/json', 'content-type': 'application/json', 'authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({ prompt, height: 960, width: 608, photoReal: true, alchemy: true, presetStyle: 'CINEMATIC', num_images: 1 })
  });

  const generationJob = await response.json();
  const generationId = generationJob.sdGenerationJob?.generationId;
  if (!generationId) { console.error(`❌ Помилка старту для ${outputFilename}:`, generationJob); return; }
  console.log(`[2/3] Завдання для ${outputFilename} створено (ID: ${generationId}). Чекаю...`);

  let imageUrl = null;
  for (let i = 0; i < 20; i++) {
    await sleep(5000);
    const checkResponse = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, { headers: { 'authorization': `Bearer ${API_KEY}` } });
    const jobStatus = await checkResponse.json();
    const generationData = jobStatus.generations_by_pk;
    if (generationData?.status === 'COMPLETE') { imageUrl = generationData.generated_images[0].url; break; }
    if (generationData?.status === 'FAILED') { console.error(`❌ Генерація ${outputFilename} не вдалася!`); return; }
  }

  if (!imageUrl) { console.error(`❌ Час очікування для ${outputFilename} вичерпано.`); return; }
  
  console.log(`[3/3] Завантажую зображення: ${outputFilename}`);
  const imageResponse = await fetch(imageUrl);
  const buffer = await imageResponse.buffer();
  fs.writeFileSync(path.join(outputFolderPath, outputFilename), buffer);
  console.log(`✅ Зображення ${outputFilename} збережено!`);
}

// !!! НОВА ФУНКЦІЯ для генерації ЧОТИРЬОХ картинок (для архетипів) !!!
async function generateArchetypeImages(archetype) {
  const { id, name, visual_prompt } = archetype;
  console.log(`[1/4] Запитую 4 PhotoReal зображення для Архетипу #${id}: ${name}`);

  const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
    method: 'POST',
    headers: { 'accept': 'application/json', 'content-type': 'application/json', 'authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({ prompt: visual_prompt, height: 1024, width: 1024, photoReal: true, alchemy: true, presetStyle: 'CINEMATIC', num_images: 4 })
  });

  const generationJob = await response.json();
  const generationId = generationJob.sdGenerationJob?.generationId;
  if (!generationId) { console.error(`❌ Помилка старту для архетипу #${id}. Відповідь:`, generationJob); return; }
  console.log(`[2/4] Завдання для #${id} створено (ID: ${generationId}). Чекаю на результат...`);

  let generatedImages = [];
  for (let i = 0; i < 30; i++) { // Даємо більше часу, бо 4 картинки
    await sleep(6000);
    const checkResponse = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, { headers: { 'authorization': `Bearer ${API_KEY}` } });
    const jobStatus = await checkResponse.json();
    const generationData = jobStatus.generations_by_pk;
    if (generationData?.status === 'COMPLETE') { generatedImages = generationData.generated_images; break; }
    if (generationData?.status === 'FAILED') { console.error(`❌ Генерація для #${id} не вдалася!`); return; }
  }

  if (generatedImages.length === 0) { console.error(`❌ Час очікування для #${id} вичерпано.`); return; }
  
  console.log(`[3/4] Отримано ${generatedImages.length} зображень для #${id}. Завантажую...`);

  for (let i = 0; i < generatedImages.length; i++) {
    const imageUrl = generatedImages[i].url;
    const filename = `archetype_${id}(${i + 1}).png`;
    
    const imageResponse = await fetch(imageUrl);
    const buffer = await imageResponse.buffer();
    fs.writeFileSync(path.join(ARCHETYPES_IMG_FOLDER, filename), buffer);
    console.log(`[4/4] ✅ Зображення ${filename} збережено!`);
  }
}

async function run() {
  if (!fs.existsSync(QUESTIONS_IMG_FOLDER)) fs.mkdirSync(QUESTIONS_IMG_FOLDER, { recursive: true });
  if (!fs.existsSync(ARCHETYPES_IMG_FOLDER)) fs.mkdirSync(ARCHETYPES_IMG_FOLDER, { recursive: true });

  console.log('--- Починаю генерацію картинок для ПИТАНЬ ---');
  for (const question of questions) {
    const filename = `q${question.id}.png`;
    if (!fs.existsSync(path.join(QUESTIONS_IMG_FOLDER, filename))) {
      await generateSingleImage(question.image_prompt, QUESTIONS_IMG_FOLDER, filename);
      await sleep(2000);
    } else {
      console.log(`- Файл ${filename} вже існує, пропускаю.`);
    }
  }

  console.log('--- Починаю генерацію картинок для АРХЕТИПІВ ---');
  for (const archetype of archetypes) {
    // Перевіряємо, чи існує хоча б перший файл. Якщо ні, генеруємо всі 4.
    const firstFilename = `archetype_${archetype.id}(1).png`;
    if (!fs.existsSync(path.join(ARCHETYPES_IMG_FOLDER, firstFilename))) {
      await generateArchetypeImages(archetype);
      await sleep(2000);
    } else {
      console.log(`- Зображення для архетипу #${archetype.id} вже існують, пропускаю.`);
    }
  }
  
  console.log('🎉🎉🎉 Всі зображення згенеровано! 🎉🎉🎉');
}

run();