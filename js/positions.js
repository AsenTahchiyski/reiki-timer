// Reiki self-treatment hand positions. Short sessions use the first N,
// long sessions extend down the body. `hands` are [x, y, rotation] pairs on
// the 200x330 figure viewBox; `back: true` means the figure is viewed from behind.
export const POSITIONS = [
  {
    hands: [[86, 12, -15], [114, 12, 15]],
    en: { title: "Crown", desc: "Place both hands lightly on top of your head to soothe a busy mind and reconnect with the present moment." },
    bg: { title: "Теме", desc: "Поставете двете си ръце леко върху темето, за да успокоите неспокойния ум и да се свържете с настоящия момент." },
  },
  {
    hands: [[87, 38, -10], [113, 38, 10]],
    en: { title: "Eyes & Face", desc: "Cup your palms gently over your eyes to rest tired eyes and quiet the senses." },
    bg: { title: "Очи и лице", desc: "Поставете дланите си нежно върху очите, за да отморите уморените очи и да успокоите сетивата." },
  },
  {
    hands: [[68, 40, -75], [132, 40, 75]],
    en: { title: "Temples", desc: "Rest your hands on the sides of your head, over the temples, to ease mental tension and worry." },
    bg: { title: "Слепоочия", desc: "Поставете ръцете си отстрани на главата, върху слепоочията, за да облекчите умственото напрежение и тревогите." },
  },
  {
    back: true,
    hands: [[87, 34, -10], [113, 34, 10]],
    en: { title: "Back of Head", desc: "Cradle the back of your head with both hands to release stress and invite deep relaxation." },
    bg: { title: "Тил", desc: "Обхванете тила с двете си ръце, за да освободите стреса и да се отпуснете дълбоко." },
  },
  {
    hands: [[89, 70, -20], [111, 70, 20]],
    en: { title: "Throat", desc: "Rest your hands lightly around your throat to support clear expression and calm communication." },
    bg: { title: "Гърло", desc: "Поставете ръцете си леко около гърлото, за да подкрепите ясното изразяване и спокойното общуване." },
  },
  {
    hands: [[87, 98, -10], [113, 98, 10]],
    en: { title: "Heart", desc: "Place both hands over the centre of your chest to nurture self-love and emotional balance." },
    bg: { title: "Сърце", desc: "Поставете двете си ръце върху центъра на гърдите, за да подхраните любовта към себе си и емоционалния баланс." },
  },
  {
    hands: [[87, 128, -10], [113, 128, 10]],
    en: { title: "Solar Plexus", desc: "Rest your hands just below the ribcage to release inner tension and strengthen confidence." },
    bg: { title: "Слънчев сплит", desc: "Поставете ръцете си точно под ребрата, за да освободите вътрешното напрежение и да укрепите увереността си." },
  },
  {
    hands: [[87, 155, -10], [113, 155, 10]],
    en: { title: "Lower Abdomen", desc: "Place your hands below the navel to support digestion and a sense of inner stability." },
    bg: { title: "Долна част на корема", desc: "Поставете ръцете си под пъпа, за да подпомогнете храносмилането и усещането за вътрешна стабилност." },
  },
  {
    hands: [[78, 178, -35], [122, 178, 35]],
    en: { title: "Hips & Root", desc: "Rest your hands on your hips to feel grounded, safe and secure." },
    bg: { title: "Ханш и корен", desc: "Поставете ръцете си върху ханша, за да се почувствате заземени, спокойни и сигурни." },
  },
  {
    hands: [[70, 80, -30], [130, 80, 30]],
    en: { title: "Shoulders", desc: "Cross your arms and rest each hand on the opposite shoulder to melt away carried burdens." },
    bg: { title: "Рамене", desc: "Кръстосайте ръце и поставете всяка длан върху срещуположното рамо, за да освободите натрупаното напрежение." },
  },
  {
    back: true,
    hands: [[84, 150, -15], [116, 150, 15]],
    en: { title: "Lower Back", desc: "Reach behind and rest your hands over the kidneys to restore energy and ease lower-back tension." },
    bg: { title: "Кръст", desc: "Поставете ръцете си отзад върху бъбреците, за да възстановите енергията и да облекчите напрежението в кръста." },
  },
  {
    back: true,
    hands: [[90, 172, -10], [110, 172, 10]],
    en: { title: "Sacrum", desc: "Place your hands on the sacrum, at the base of the spine, to ground and stabilise your energy." },
    bg: { title: "Сакрум", desc: "Поставете ръцете си върху сакрума, в основата на гръбнака, за да заземите и стабилизирате енергията си." },
  },
  {
    hands: [[84, 235, -5], [116, 235, 5]],
    en: { title: "Knees", desc: "Rest one hand on each knee to support flexibility and ease any fear of moving forward." },
    bg: { title: "Колене", desc: "Поставете по една ръка върху всяко коляно, за да подкрепите гъвкавостта и да облекчите страха от движение напред." },
  },
  {
    hands: [[84, 282, -5], [116, 282, 5]],
    en: { title: "Ankles", desc: "Hold your ankles gently to strengthen your connection with the earth." },
    bg: { title: "Глезени", desc: "Хванете нежно глезените си, за да укрепите връзката си със земята." },
  },
  {
    hands: [[84, 308, -5], [116, 308, 5]],
    en: { title: "Feet", desc: "Cup the soles of your feet to complete the flow and seal the treatment, feeling fully grounded." },
    bg: { title: "Стъпала", desc: "Обхванете стъпалата си, за да завършите потока и да завършите сесията, чувствайки се напълно заземени." },
  },
];

export function getPosition(index) {
  return POSITIONS[index % POSITIONS.length];
}

// Renders a stylised figure with glowing hands at the given position.
export function figureSVG(position) {
  const hands = position.hands
    .map(([x, y, r]) => `
      <g class="hand" transform="translate(${x} ${y}) rotate(${r})">
        <ellipse rx="20" ry="15" fill="url(#glow)"/>
        <ellipse rx="12" ry="8.5" fill="var(--accent)"/>
        <ellipse rx="12" ry="8.5" fill="none" stroke="var(--accent-soft)" stroke-width="1.2"/>
      </g>`)
    .join("");

  return `
  <svg viewBox="0 0 200 330" xmlns="http://www.w3.org/2000/svg" role="img">
    <defs>
      <radialGradient id="glow">
        <stop offset="0%" stop-color="var(--accent-soft)" stop-opacity=".55"/>
        <stop offset="100%" stop-color="var(--accent-soft)" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <g fill="var(--figure-body)" stroke="var(--figure-line)" stroke-width="2">
      <circle cx="100" cy="42" r="27"/>
      <rect x="91" y="64" width="18" height="14" rx="6"/>
      <path d="M70 78 Q100 70 130 78 L135 130 Q136 165 128 184 Q100 196 72 184 Q64 165 65 130 Z"/>
      <rect x="72" y="182" width="25" height="118" rx="12"/>
      <rect x="103" y="182" width="25" height="118" rx="12"/>
      <ellipse cx="83" cy="304" rx="15" ry="9"/>
      <ellipse cx="117" cy="304" rx="15" ry="9"/>
    </g>
    ${hands}
  </svg>`;
}
