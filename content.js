/* Content for Eitan's game. Word lists are the teacher's (prd.md §4.2).
   Days 1 to 4: the 11 ch words, the 12 sh words, and 8 + 12 + 18 food words. Day 5: the ten phrases.
   `sent` is a sentence of ours with the word missing, and three words that do not fit it. */
window.CONTENT = {
  startDate: '2026-11-16', // day 1
  testDate: '2026-11-25',
  playerName: 'Eitan', // a name: capital first letter, always

  /* What the stadium says after an answer. {w} is the word. Picked so the same line never comes twice in a row.
     The lines are about the word, never about the player. */
  cheers: {
    combo: {
      3: 'שלושער!', 5: 'חמש ברצף! היציע רועד', 8: 'שמונה ברצף! המילים מבקשות פסק זמן',
      10: 'עשר ברצף! המילים מבקשות חילוף', 15: '15 ברצף! השופט בודק אם זה חוקי', 20: '20 ברצף! האצטדיון שר',
      30: '30 ברצף! המילים מחפשות את היציאה', 40: '40 ברצף! אגדה במגרש', 50: '50 ברצף! אין מילים. באמת, לא נשארו',
    },
    head: {
      recognise: ['נחשפה!', 'התחפושת נפלה!', 'זוהתה!', 'אין לה איפה להתחבא!', 'נתפסה על חם!'],
      whistle: ['אוזן של שופט!', 'שריקה מדויקת!', 'נשמע עד היציע!', 'האוזן לא מפספסת!', 'שומעים הכול!'],
      missing: ['האותיות חזרו הביתה!', 'סגירה הרמטית!', 'החור נסתם!', 'בדיוק במקום!', 'המילה שלמה שוב!'],
      bank: ['נשלפה מהמחסן!', 'בחירה של קפטן!', 'נמצאה בין כולן!', 'הוצאה מהשורה!', 'אין לה לאן לברוח!'],
      sentence: ['המשפט שלם!', 'מסירה מדויקת!', 'נכנסה בדיוק לרווח!', 'המשפט סגור!', 'חיבור מושלם!'],
      colour: ['החולצה הנכונה!', 'המחסנאי מוחא כפיים!', 'צבע מדויק!', 'ישר מהמתלה!', 'החולצה נמצאה!'],
      dinner: ['הטבח מרוצה!', 'בדיוק מה שחסר!', 'ישר לסיר!', 'המצרך הנכון!', 'ארוחה של אלופים!'],
      letter: ['זוג מושלם!', 'האותיות נפגשו!', 'גדולה וקטנה, יחד!', 'הזוג הושלם!', 'מספר נכון על החולצה!'],
      where: ['הכדור אותר!', 'עין של חלוץ!', 'בדיוק שם!', 'הכדור לא מצליח להתחבא!', 'נמצא!'],
      spell: ['גוווול!', 'ישר לחיבורים!', 'רשת!', 'פנדל מושלם!', 'השוער אפילו לא זז!', 'בעיטה של קפטן!'],
    },
    sub: [
      '{w} בפנים.', '{w} לא ראתה את זה בא.', '{w} ניסתה להתחמק. לא הלך לה.', '{w} עוד מחפשת את הכדור.',
      '{w} על הדשא. הבאה בתור!', '{w} הרימה ידיים.', '{w} מבקשת VAR. אין לה סיכוי.', '{w} חוזרת לספסל.',
      'המאמן של {w} תופס את הראש.', '{w} מעמידה פנים שזה לא קרה.', 'הקהל שר, {w} שותקת.', '{w} רצה להתלונן לשופט.',
    ],
    slip: ['{w} חמקה!', '{w} התחמקה ברגע האחרון!', '{w} ברחה לקו האמצע!', '{w} קנתה לעצמה עוד סיבוב!', '{w} עשתה תרגיל הטעיה!'],
  },

  levels: ['', 'חדשה', 'מתחממת', 'בסגל', 'בהרכב', 'אגדה'],

  stages: [
    { name: 'מבחני האקדמיה', from: 0 },
    { name: 'קבוצת הנוער', from: 1 },
    { name: 'הקבוצה הראשונה', from: 3 },
    { name: 'ליל ליגת האלופות', from: 6 },
    { name: 'הקלאסיקו', from: 8 },
  ],

  // `line` is the word's entrance: the humor is on the word, never on the player.
  words: [
    { id: 'chicken', en: 'chicken', he: 'תרנגולת / עוף', emoji: '🐔', blend: 'ch', day: 1, line: 'מתחבאת מאחורי השער ומקרקרת בשקט.', sent: ['Eggs come from a ___.', ['chair', 'shirt', 'school']] },
    { id: 'chips', en: 'chips', he: "צ'יפס", emoji: '🍟', blend: 'ch', day: 1, line: 'חושבת שהיא פריכה מדי בשביל להיתפס.', sent: ['I eat a hamburger and ___.', ['shoes', 'chair', 'school']] },
    { id: 'chocolate', en: 'chocolate', he: 'שוקולד', emoji: '🍫', blend: 'ch', day: 1, line: 'ארוכה, מתוקה, וכבר נמסה מלחץ.', sent: ['I drink a ___ milkshake. It is brown.', ['fish', 'spinach', 'chair']] },
    { id: 'sandwich', en: 'sandwich', he: 'כריך', emoji: '🥪', blend: 'ch', day: 1, line: 'מחביאה את ה-ch שלה בסוף, בין שתי פרוסות.', sent: ['I make a ___ with bread and cheese.', ['milkshake', 'shirt', 'chair']] },
    { id: 'cheese', en: 'cheese', he: 'גבינה', emoji: '🧀', blend: 'ch', day: 1, line: 'מלאה חורים. גם ההגנה שלה.', sent: ['A mouse likes to eat ___.', ['shoes', 'chair', 'school']] },
    { id: 'chair', en: 'chair', he: 'כיסא', emoji: '🪑', blend: 'ch', day: 1, line: 'יושבת על הספסל ומקווה שלא ישימו לב אליה.', sent: ['I sit on a ___.', ['cheese', 'fish', 'sandwich']] },
    { id: 'teacher', en: 'teacher', he: 'מורה', emoji: '🧑‍🏫', blend: 'ch', day: 1, line: 'מסתירה את ה-ch באמצע ועושה פרצוף רציני.', sent: ['My ___ is at school with the children.', ['chicken', 'kitchen', 'sandwich']] },
    { id: 'children', en: 'children', he: 'ילדים', emoji: '🧒', blend: 'ch', day: 1, line: 'רצה במגרש בכל הכיוונים וצועקת.', sent: ['The ___ play at school.', ['chips', 'shoes', 'cheese']] },
    { id: 'kitchen', en: 'kitchen', he: 'מטבח', emoji: '🍳', blend: 'ch', day: 1, line: 'מרעישה בסירים כדי לבלבל.', sent: ['Mum makes food in the ___.', ['chair', 'sheep', 'shirt']] },
    { id: 'spinach', en: 'spinach', he: 'תרד', emoji: '🥬', blend: 'ch', day: 1, line: 'ירוקה מפחד. ה-ch שלה בסוף.', sent: ['___ is a green vegetable.', ['chocolate', 'cheese', 'chicken']] },
    { id: 'school', en: 'school', he: 'בית ספר', emoji: '🏫', blend: 'ch', silent: true, day: 1, line: 'מתחכמת: ה-ch שלה מתחפש ונשמע כמו k. כותבים אותה עם ch בכל זאת.', sent: ['The teacher and the children are at ___.', ['brush', 'sheep', 'chips']] },
    // day 2: the 12 sh words and the first 8 food words
    { id: 'milkshake', en: 'milkshake', he: 'מילקשייק', emoji: '🥤', blend: 'sh', day: 2, line: 'מסתחררת בכוס עד שהיא מסוחררת בעצמה.', sent: ['I drink a chocolate ___.', ['sandwich', 'shirt', 'fish']] },
    { id: 'share', en: 'share', he: 'לחלוק / לשתף', emoji: '🤝', blend: 'sh', day: 2, line: 'לא מוכנה לחלוק את הכדור עם אף אחד.', sent: ['I ___ my chips with a friend.', ['wash', 'short', 'sheep']] },
    { id: 'shop', en: 'shop', he: 'לקנות / חנות', emoji: '🏪', blend: 'sh', day: 2, line: 'מנסה למכור לשופט כרטיס צהוב במבצע.', sent: ['We buy food in a ___.', ['brush', 'sheep', 'shirt']] },
    { id: 'short', en: 'short', he: 'קצר / נמוך', emoji: '📏', blend: 'sh', day: 2, line: 'קצרה, ובטוחה שלא יראו אותה מאחורי הדשא.', sent: ['He is not tall. He is ___.', ['fish', 'shop', 'wash']] },
    { id: 'wash', en: 'wash', he: 'לשטוף / לרחוץ', emoji: '🧼', blend: 'sh', day: 2, line: 'מלאה קצף ומחליקה על המגרש.', sent: ['I ___ my hands with water.', ['share', 'shop', 'short']] },
    { id: 'fish', en: 'fish', he: 'דג / דגים', emoji: '🐟', blend: 'sh', day: 2, line: 'שותקת כמו דג. ה-sh שלה בסוף.', sent: ['A ___ lives in water.', ['sheep', 'chair', 'shirt']] },
    { id: 'shopping', en: 'shopping', he: 'קניות', emoji: '🛒', blend: 'sh', day: 2, line: 'דוחפת עגלה באמצע המגרש וחוסמת את כולם.', sent: ['Mum has a ___ list.', ['sheep', 'shoes', 'short']] },
    { id: 'brush', en: 'brush', he: 'מברשת', emoji: '🪥', blend: 'sh', day: 2, line: 'מצחצחת את עצמה במקום לשמור על השער.', sent: ['I clean my shoes with a ___.', ['sheep', 'shop', 'fish']] },
    { id: 'sheep', en: 'sheep', he: 'כבשה', emoji: '🐑', blend: 'sh', day: 2, line: 'סופרת את עצמה ונרדמת על הקו.', sent: ['A ___ is an animal. It says baa.', ['shirt', 'shoes', 'chair']] },
    { id: 'shirt', en: 'shirt', he: 'חולצה', emoji: '👕', blend: 'sh', day: 2, line: 'מקופלת יפה בארון ומקווה שתישאר שם.', sent: ['I wear a ___ and shorts.', ['sheep', 'fish', 'chair']] },
    { id: 'shorts', en: 'shorts', he: 'מכנסיים קצרים', emoji: '🩳', blend: 'sh', day: 2, line: 'כמעט כמו short, רק עם s בסוף. תאומות שמנסות לבלבל.', sent: ['It is hot. I wear ___.', ['short', 'sheep', 'cheese']] },
    { id: 'shoes', en: 'shoes', he: 'נעליים', emoji: '👟', blend: 'sh', day: 2, line: 'קשרה את השרוכים שלה זה לזה. בהצלחה לה.', sent: ['I wear ___ on my feet.', ['shirt', 'chips', 'sheep']] },
    { id: 'pizza', en: 'pizza', he: 'פיצה', emoji: '🍕', day: 2, line: 'עגולה, חמה, ומסתובבת סביב עצמה.', sent: ['I eat ___ with cheese on top.', ['water', 'milk', 'shoes']] },
    { id: 'bread', en: 'bread', he: 'לחם', emoji: '🍞', day: 2, line: 'פרוסה אחרי פרוסה, ההגנה שלה מתפוררת.', sent: ['I make a sandwich with ___.', ['water', 'shirt', 'chair']] },
    { id: 'eggs', en: 'eggs', he: 'ביצים', emoji: '🥚', day: 2, line: 'שבירה מאוד. היא יודעת את זה.', sent: ['A chicken makes ___.', ['shoes', 'bread', 'chips']] },
    { id: 'milk', en: 'milk', he: 'חלב', emoji: '🥛', day: 2, line: 'נשפכת מלחץ עוד לפני השריקה.', sent: ['I make a milkshake with ___.', ['bread', 'fish', 'chips']] },
    { id: 'water', en: 'water', he: 'מים', emoji: '💧', day: 2, line: 'מנסה לחמוק בין האצבעות.', sent: ['I wash my hands with ___.', ['bread', 'cake', 'eggs']] },
    { id: 'apples', en: 'apples', he: 'תפוחים', emoji: '🍎', day: 2, line: 'מתגלגלת לכל הכיוונים כדי לא להיתפס.', sent: ['___ are red fruit.', ['bananas', 'eggs', 'chips']] },
    { id: 'bananas', en: 'bananas', he: 'בננות', emoji: '🍌', day: 2, line: 'משאירה קליפות על הדשא. תכסיס ישן.', sent: ['___ are yellow fruit.', ['apples', 'eggs', 'shoes']] },
    { id: 'cake', en: 'cake', he: 'עוגה', emoji: '🍰', day: 2, line: 'מתוקה מבחוץ, לחוצה מבפנים.', sent: ['We eat ___ at a birthday party.', ['water', 'chair', 'sheep']] },
    // day 3: 12 food words (the colour-sort ones first). Colours and prepositions come with the Kit room, not as cards here.
    // The other 18 food words move to day 4 (split decided 17 Nov: day 3 was too heavy).
    { id: 'lemon', en: 'lemon', he: 'לימון', emoji: '🍋', day: 3, line: 'חמוצה כל כך שהיא עושה פרצוף לעצמה במראה.', sent: ['A ___ is yellow and sour.', ['chair', 'shirt', 'sheep']] },
    { id: 'tomatoes', en: 'tomatoes', he: 'עגבניות', emoji: '🍅', day: 3, line: 'אדומה מהתרגשות, ומתגלגלת לפינה כדי להתחבא.', sent: ['I put red ___ in the salad.', ['shoes', 'chair', 'brush']] },
    { id: 'cookie', en: 'cookie', he: 'עוגיה', emoji: '🍪', day: 3, line: 'מתפוררת מלחץ בכל פעם שמסתכלים עליה.', sent: ['I eat a ___ with my milk.', ['shoes', 'chair', 'brush']] },
    { id: 'oranges', en: 'oranges', he: 'תפוזים', emoji: '🍊', day: 3, line: 'מתגלגלת לכיוון הקורנר ומקווה שלא יספרו אותה.', sent: ['___ are orange fruit.', ['bananas', 'eggs', 'chair']] },
    { id: 'juice', en: 'juice', he: 'מיץ', emoji: '🧃', day: 3, line: 'סחוטה לגמרי אחרי המחצית הראשונה.', sent: ['I drink orange ___ in the morning.', ['shirt', 'chair', 'bread']] },
    { id: 'salad', en: 'salad', he: 'סלט', emoji: '🥗', day: 3, line: 'מעורבבת כל כך שאף אחד לא יודע איפה היא מתחילה.', sent: ['I eat a ___ with tomatoes.', ['shirt', 'chair', 'shoes']] },
    { id: 'meat', en: 'meat', he: 'בשר', emoji: '🥩', day: 3, line: 'קשוחה, אבל נכנעת מול מזלג אחד.', sent: ['A hamburger is made of ___.', ['water', 'cake', 'bananas']] },
    { id: 'hamburger', en: 'hamburger', he: 'המבורגר', emoji: '🍔', day: 3, line: 'מתחבאת בין שתי לחמניות ומקווה שיחשבו שהיא כריך.', sent: ['I eat a ___ with chips.', ['shirt', 'chair', 'milk']] },
    { id: 'jam', en: 'jam', he: 'ריבה', emoji: '🍓', day: 3, line: 'דביקה, ונצמדת לכל מי שעובר לידה.', sent: ['I put ___ on my bread.', ['shoes', 'fish', 'chair']] },
    { id: 'carrots', en: 'carrots', he: 'גזרים', emoji: '🥕', day: 3, line: 'כתומה, ארוכה, ובטוחה שהארנבים לא יזהו אותה.', sent: ['___ are orange vegetables.', ['apples', 'shoes', 'cake']] },
    { id: 'tea', en: 'tea', he: 'תה', emoji: '🍵', day: 3, line: 'שקטה בתוך הכוס ומחכה שיפסיקו להסתכל.', sent: ['I drink hot ___ with lemon.', ['shirt', 'bread', 'chair']] },
    { id: 'coffee', en: 'coffee', he: 'קפה', emoji: '☕', day: 3, line: 'ערה כל הלילה ומרעידה את הכוס.', sent: ['My dad drinks ___ in the morning.', ['shirt', 'bread', 'chair']] },
    // day 4: the last 18 food words. Three of them are two words long: they are read and picked, never typed in the shoot-out.
    { id: 'food', en: 'food', he: 'מאכלים', emoji: '🍲', day: 4, line: 'גדולה כל כך שכל המאכלים מתחבאים בתוכה.', sent: ['Pizza and bread are ___.', ['drinks', 'shoes', 'children']] },
    { id: 'drinks', en: 'drinks', he: 'משקאות', emoji: '🍹', day: 4, line: 'נשפכת לכל הכיוונים כדי שלא יתפסו אותה.', sent: ['Water and juice are ___.', ['vegetables', 'fruit', 'shoes']] },
    { id: 'fruit', en: 'fruit', he: 'פירות', emoji: '🍇', day: 4, line: 'מתחבאת בסלסילה בין התפוחים לבננות.', sent: ['Apples and bananas are ___.', ['vegetables', 'drinks', 'meat']] },
    { id: 'vegetables', en: 'vegetables', he: 'ירקות', emoji: '🥦', day: 4, line: 'הכי ארוכה בגינה, ומנסה להתכופף.', sent: ['Carrots and onions are ___.', ['fruit', 'drinks', 'shoes']] },
    { id: 'onions', en: 'onions', he: 'בצלים', emoji: '🧅', day: 4, line: 'גורמת לשופט לבכות, ומקווה שזה יעזור לה.', sent: ['___ are vegetables. They make me cry.', ['apples', 'bananas', 'eggs']] },
    { id: 'peppers', en: 'peppers', he: 'פלפלים', emoji: '🫑', day: 4, line: 'מחליפה צבעים כל הזמן כדי שלא יזהו אותה.', sent: ['___ are red, green or yellow vegetables.', ['bananas', 'sheep', 'eggs']] },
    { id: 'icecream', en: 'ice cream', he: 'גלידה', emoji: '🍦', day: 4, line: 'מטפטפת על הדשא ומשאירה עקבות. שתי מילים, גביע אחד.', sent: ['I eat cold ___ in the summer.', ['chair', 'shoes', 'table']] },
    { id: 'restaurant', en: 'restaurant', he: 'מסעדה', emoji: '🍴', day: 4, line: 'מזמינה שולחן לשניים במקום לשמור על השער.', sent: ['We eat pizza at a ___.', ['shirt', 'sheep', 'brush']] },
    { id: 'table', en: 'table', he: 'שולחן', emoji: '🍽️', day: 4, line: 'עומדת על ארבע רגליים ולא זזה. זאת כל התוכנית שלה.', sent: ['The food is on the ___ in the kitchen.', ['juice', 'sheep', 'fish']] },
    { id: 'eat', en: 'eat', he: 'לאכול', emoji: '😋', day: 4, line: 'קצרה כל כך שהיא נבלעת בביס אחד.', sent: ['I ___ a sandwich at school.', ['drink', 'wash', 'sheep']] },
    { id: 'drink', en: 'drink', he: 'לשתות', emoji: '🚰', day: 4, line: 'לוגמת מים ליד הקו ומעמידה פנים שהיא לא במשחק.', sent: ['I ___ water and juice.', ['eat', 'brush', 'short']] },
    { id: 'hungry', en: 'hungry', he: 'רעב', emoji: '🤤', day: 4, line: 'רעבה כל כך שהבטן שלה מקרקרת בקול ומסגירה אותה.', sent: ['I want to eat. I am ___.', ['bread', 'table', 'juice']] },
    { id: 'want', en: 'want', he: 'לרצות', emoji: '🤲', day: 4, line: 'רוצה את הכדור, רוצה את השער, רוצה הביתה.', sent: ['I am hungry. I ___ a pizza, please.', ['short', 'fish', 'table']] },
    { id: 'like', en: 'like', he: 'לאהוב', emoji: '👍', day: 4, line: 'אוהבת את כולם ומקווה שיוותרו לה.', sent: ['I ___ chocolate. It is good!', ['chair', 'short', 'table']] },
    { id: 'dontlike', en: "don't like", he: 'לא לאהוב', emoji: '👎', day: 4, line: 'לא אוהבת שתופסים אותה. שתי מילים וגרש באמצע.', sent: ['I ___ spinach. It is not good.', ['kitchen', 'fruit', 'hungry']] },
    { id: 'make', en: 'make', he: 'להכין', emoji: '🧑‍🍳', day: 4, line: 'מכינה תוכנית בריחה. התוכנית עוד לא מוכנה.', sent: ['I ___ a salad with tomatoes and carrots.', ['drink', 'short', 'school']] },
    { id: 'need', en: 'need', he: 'צריך', emoji: '❗', day: 4, line: 'צריכה רק דבר אחד: שלא יסתכלו עליה.', sent: ['I want to make a cake. I ___ eggs and milk.', ['short', 'chair', 'hungry']] },
    { id: 'shoppinglist', en: 'shopping list', he: 'רשימת קניות', emoji: '📝', blend: 'sh', day: 4, line: 'רשמה לעצמה איך לברוח, ושכחה את הרשימה בבית.', sent: ['Mum writes a ___ and goes to the shop.', ['milkshake', 'spinach', 'restaurant']] },
    // day 5: the phrases (prd.md §4.3). `phrase` cards are read and picked among themselves, never typed, and have no sentence.
    { id: 'p-like', en: 'I like…', he: 'אני אוהב…', emoji: '😍', phrase: true, day: 5, line: 'מחפשת משהו לאהוב. שלוש הנקודות מחכות למאכל.' },
    { id: 'p-dontlike', en: "I don't like…", he: 'אני לא אוהב…', emoji: '🙅', phrase: true, day: 5, line: 'מעקמת את האף עוד לפני שהגישו לה.' },
    { id: 'p-want', en: 'I want…', he: 'אני רוצה…', emoji: '🙋', phrase: true, day: 5, line: 'מושיטה ידיים לכל מגש שעובר.' },
    { id: 'p-need', en: 'I need…', he: 'אני צריך…', emoji: '☝️', phrase: true, day: 5, line: 'בטוחה שבלי המילה הבאה היא לא שורדת את המחצית.' },
    { id: 'p-hungry', en: "I'm hungry", he: 'אני רעב', emoji: '🤤', phrase: true, day: 5, line: 'נשמעת מהיציע כבר מהדקה הראשונה.' },
    { id: 'p-doyou', en: 'Do you like…?', he: 'אתה אוהב…?', emoji: '🤔', phrase: true, day: 5, line: 'שואלת את כולם שאלות כדי להרוויח זמן.' },
    { id: 'p-yes', en: 'Yes, I do', he: 'כן, אני אוהב', emoji: '✅', phrase: true, day: 5, line: 'מהנהנת בלי הפסקה, גם כשלא שאלו אותה.' },
    { id: 'p-no', en: "No, I don't", he: 'לא, אני לא אוהב', emoji: '❌', phrase: true, day: 5, line: 'מנענעת את הראש ומסרבת לרדת מהספסל.' },
    { id: 'p-eat', en: 'What do you want to eat?', he: 'מה אתה רוצה לאכול?', emoji: '🍴', phrase: true, day: 5, line: 'מסתובבת עם תפריט ומבלבלת את ההגנה.' },
    { id: 'p-drink', en: 'What do you want to drink?', he: 'מה אתה רוצה לשתות?', emoji: '🥤', phrase: true, day: 5, line: 'מחלקת כוסות ליד הקו במקום לשחק.' },
  ],

  /* The Kit room (prd.md §6.3): test-shaped sets, never Leitner cards. Opens on day `from`.
     colours: the owner's list of 19 Nov. sort: only foods whose colour is not in doubt (exercise 3 of the test).
     preps: where the ball is, next to the box. */
  kit: {
    from: 5,
    colours: [
      { en: 'red', he: 'אדום', hex: '#e02b2b' }, { en: 'blue', he: 'כחול', hex: '#1f6fe0' },
      { en: 'green', he: 'ירוק', hex: '#2faa4f' }, { en: 'yellow', he: 'צהוב', hex: '#f5d21f' },
      { en: 'orange', he: 'כתום', hex: '#f58a1f' }, { en: 'brown', he: 'חום', hex: '#7a4a21' },
      { en: 'black', he: 'שחור', hex: '#15171c' }, { en: 'white', he: 'לבן', hex: '#ffffff' },
      { en: 'purple', he: 'סגול', hex: '#8a3fd1' }, { en: 'grey', he: 'אפור', hex: '#8d949e' },
    ],
    sort: {
      red: ['tomatoes', 'apples'], yellow: ['bananas', 'lemon', 'cheese', 'chips'], brown: ['chocolate', 'bread', 'cookie'],
      orange: ['oranges', 'carrots'], green: ['spinach', 'salad'], white: ['milk', 'eggs'],
    },
    preps: [{ en: 'in', he: 'בתוך' }, { en: 'on', he: 'על' }, { en: 'under', he: 'מתחת' }, { en: 'near', he: 'ליד' }],
  },

  /* Team dinner (exercise 5 of the test): "I want to make a pizza. I need ___." Opens on day `from`, three dishes a day.
     `need` are ingredients nobody would argue with; `not` are words that clearly do not go in. All are word ids. */
  dinner: {
    from: 6,
    dishes: [
      { dish: 'a pizza', need: ['cheese', 'tomatoes'], not: ['jam', 'tea', 'shoes', 'cookie', 'juice', 'icecream'] },
      { dish: 'a salad', need: ['tomatoes', 'carrots', 'peppers', 'onions'], not: ['chocolate', 'cake', 'coffee', 'shirt', 'jam', 'cookie'] },
      { dish: 'a sandwich', need: ['bread', 'cheese'], not: ['juice', 'tea', 'chair', 'water', 'coffee', 'sheep'] },
      { dish: 'a milkshake', need: ['milk', 'chocolate', 'bananas'], not: ['onions', 'meat', 'fish', 'peppers', 'shoes', 'bread'] },
      { dish: 'a cake', need: ['eggs', 'milk', 'chocolate'], not: ['onions', 'meat', 'fish', 'peppers', 'spinach', 'brush'] },
      { dish: 'a hamburger', need: ['meat', 'bread'], not: ['jam', 'juice', 'cake', 'cookie', 'tea', 'shirt'] },
    ],
  },

  /* Kit numbers (exercise 6 of the test): the capital and the small letter of every pair, Aa to Zz.
     One set a day from day `from`; after the last set, eight letters a day from the whole alphabet. */
  letters: { from: 5, sets: ['abcdef', 'ghijkl', 'mnopqr', 'stuvwxyz'], mixed: 8 },

  /* The Match report (prd.md §4.6, exercise 8 of the test): short texts of ours, written from the test words.
     Three of them, one a day in turn from day `from`. Each has three yes/no lines and three one-word completions.
     `at` is the sentence that holds the answer: it lights up after a miss. */
  report: {
    from: 5,
    passages: [
      {
        title: 'At school',
        text: ['I am Tom.', 'I am at school.', 'I am hungry.', 'I have a sandwich with cheese and tomatoes.', 'I like cheese.',
          "I don't like onions.", 'I drink water.', 'My teacher is near the table.', 'The children eat chips.'],
        yesno: [
          { q: 'Tom is at school.', a: true, at: 1 },
          { q: 'Tom is in the kitchen.', a: false, at: 1 },
          { q: 'The children eat pizza.', a: false, at: 8 },
        ],
        fill: [
          { q: 'Tom has a ___ with cheese.', a: 'sandwich', wrong: ['table', 'teacher', 'school'], at: 3 },
          { q: 'Tom drinks ___.', a: 'water', wrong: ['cheese', 'chips', 'onions'], at: 6 },
          { q: 'The teacher is near the ___.', a: 'table', wrong: ['children', 'sandwich', 'tomatoes'], at: 7 },
        ],
      },
      {
        title: 'In the kitchen',
        text: ['This is my kitchen.', 'Mum is in the kitchen.', 'We make a salad.', 'We need tomatoes, carrots and peppers.',
          'The vegetables are on the table.', 'The bread is near the eggs.', 'I want a milkshake.', 'Mum has coffee.', 'We eat the salad with fish.'],
        yesno: [
          { q: 'Mum is in the kitchen.', a: true, at: 1 },
          { q: 'We make a pizza.', a: false, at: 2 },
          { q: 'The vegetables are under the table.', a: false, at: 4 },
        ],
        fill: [
          { q: 'We need tomatoes, carrots and ___.', a: 'peppers', wrong: ['eggs', 'bread', 'fish'], at: 3 },
          { q: 'I want a ___.', a: 'milkshake', wrong: ['coffee', 'salad', 'kitchen'], at: 6 },
          { q: 'The bread is near the ___.', a: 'eggs', wrong: ['table', 'carrots', 'salad'], at: 5 },
        ],
      },
      {
        title: 'At the restaurant',
        text: ['I am at a restaurant with Dad.', 'I am hungry.', 'I want a hamburger and chips.', "I don't like fish.", 'We share a salad.',
          'I drink orange juice.', 'Dad has tea with lemon.', 'The ice cream is cold and good.', 'I like this restaurant!'],
        yesno: [
          { q: 'I am at school.', a: false, at: 0 },
          { q: 'I want a hamburger.', a: true, at: 2 },
          { q: 'Dad has coffee.', a: false, at: 6 },
        ],
        fill: [
          { q: 'We share a ___.', a: 'salad', wrong: ['hamburger', 'lemon', 'restaurant'], at: 4 },
          { q: 'I drink orange ___.', a: 'juice', wrong: ['tea', 'chips', 'fish'], at: 5 },
          { q: 'Dad has tea with ___.', a: 'lemon', wrong: ['salad', 'juice', 'ice cream'], at: 6 },
        ],
      },
    ],
  },

  /* The table. Clubs of ours: a football word every child knows, and a word from the test.
     Real Madrid is the rival of the Clásico. `rate` = points a club makes for every answer he gives. */
  myClub: 'Barcelona',
  clubs: [
    { name: 'Real Madrid', rate: 20 },
    { name: 'Maccabi Milkshake', rate: 17 },
    { name: 'Hapoel Chicken', rate: 15 },
    { name: 'Inter Sandwich', rate: 13 },
    { name: 'Beitar Cheese', rate: 11 },
    { name: 'Sheep United', rate: 9 },
    { name: 'Chips City', rate: 7 },
    { name: 'FC Spinach', rate: 5 },
  ],

  // sh words heard only, never shown before the answer, so the Whistle is a real choice on day 1 (before the sh words arrive).
  foils: ['sheep', 'shop', 'shirt', 'shoes', 'fish', 'brush', 'wash', 'short'],

  /* The official 2026/27 squad as listed on LALIGA's club page (laliga.com/en-GB/clubs/fc-barcelona/squad),
     from the owner's printout of 16 Nov 2026. Names as text only. */
  idols: [
    { name: 'Joan García', number: 1 },
    { name: 'João Cancelo', number: 2 },
    { name: 'Alejandro Balde', number: 3 },
    { name: 'Brian Fariñas', number: 4 },
    { name: 'Pau Cubarsí', number: 5 },
    { name: 'Gavi', number: 6 },
    { name: 'Fermín López', number: 7 },
    { name: 'Pedri', number: 8 },
    { name: 'Gabriel Jesus', number: 9 },
    { name: 'Lamine Yamal', number: 10 },
    { name: 'Raphinha', number: 11 },
    { name: 'Xavi Espart', number: 12 },
    { name: 'Wojciech Szczęsny', number: 13 },
    { name: 'Karim Adeyemi', number: 14 },
    { name: 'Andreas Christensen', number: 15 },
    { name: 'Rodrigo', number: 16 },
    { name: 'Anthony Gordon', number: 17 },
    { name: 'Gerard Martín', number: 18 },
    { name: 'Roony Bardghji', number: 19 },
    { name: 'Dani Olmo', number: 20 },
    { name: 'Frenkie de Jong', number: 21 },
    { name: 'Marc Bernal', number: 22 },
    { name: 'Jules Koundé', number: 23 },
    { name: 'Eric García', number: 24 },
    { name: 'Dominik Livaković', number: 25 },
    { name: 'Cortés', number: 26 },
    { name: 'Hamza Abdelkarim', number: 29 },
    { name: 'Ebrima Tunkara', number: 30 },
    { name: 'Eder Aller', number: 31 },
    { name: 'Orian Goren', number: 32 },
    { name: 'Jordi Pesquer', number: 33 },
    { name: 'Iker Rodríguez', number: 35 },
    { name: 'Guillem Víctor', number: 40 },
    { name: 'Álex Campos', number: 41 },
  ],
};
