#!/usr/bin/env node
/**
 * Seed de démonstration — Madrasati
 *
 * Crée une école marocaine fictive complète et crédible :
 *   - 3 niveaux / 3 classes / 6 matières / 3 trimestres
 *   - 30 élèves, leurs parents, 4 enseignants
 *   - notes, absences/retards et mensualités répartis sur l'année
 *
 * Le script est relatif à la date du jour : il choisit l'année
 * scolaire en cours, ne remplit que les trimestres commencés et ne
 * facture que les mois écoulés (impayés concentrés sur les derniers
 * mois). Il est ré-exécutable : l'école de démo existante et ses
 * comptes @demo.ma sont supprimés puis recréés.
 *
 * Prérequis : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY
 * (lus depuis l'environnement ou .env.local).
 *
 * Comptes créés (mot de passe : demo1234) :
 *   admin@demo.ma / enseignant@demo.ma / parent@demo.ma
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

// ------------------------------------------------------------------
// Environnement
// ------------------------------------------------------------------
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Variables manquantes : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (voir .env.local)."
  );
  process.exit(1);
}
const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "demo1234";
const SCHOOL_NAME = "Groupe Scolaire Al Amal";

// ------------------------------------------------------------------
// Aléatoire déterministe (démo reproductible)
// ------------------------------------------------------------------
let rngState = 42;
function rand() {
  rngState |= 0;
  rngState = (rngState + 0x6d2b79f5) | 0;
  let z = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
  return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
}
const randInt = (min, max) => min + Math.floor(rand() * (max - min + 1));
const pick = (array) => array[Math.floor(rand() * array.length)];

// ------------------------------------------------------------------
// Année scolaire relative à aujourd'hui
// ------------------------------------------------------------------
const today = new Date();
const todayISO = today.toISOString().slice(0, 10);
const startYear =
  today.getMonth() + 1 >= 8 ? today.getFullYear() : today.getFullYear() - 1;
const academicYear = `${startYear}-${startYear + 1}`;
const iso = (y, m, d) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const termsDef = [
  { name: "Trimestre 1", start: iso(startYear, 9, 1), end: iso(startYear, 12, 6) },
  { name: "Trimestre 2", start: iso(startYear, 12, 8), end: iso(startYear + 1, 3, 14) },
  { name: "Trimestre 3", start: iso(startYear + 1, 3, 16), end: iso(startYear + 1, 6, 27) },
];

// Mois facturés : de septembre à juin, uniquement les mois commencés
const billedMonths = [];
for (let offset = 0; offset < 10; offset++) {
  const month = ((9 + offset - 1) % 12) + 1;
  const year = month >= 9 ? startYear : startYear + 1;
  const first = iso(year, month, 1);
  if (first <= todayISO) billedMonths.push(first);
}

/** Jour ouvré (lun-ven) aléatoire d'un mois, borné à aujourd'hui */
function schoolDay(monthFirst) {
  const [y, m] = monthFirst.split("-").map(Number);
  for (let tries = 0; tries < 20; tries++) {
    const d = randInt(1, 28);
    const date = new Date(Date.UTC(y, m - 1, d));
    const dow = date.getUTCDay();
    const s = iso(y, m, d);
    if (dow >= 1 && dow <= 5 && s <= todayISO) return s;
  }
  return null;
}

// ------------------------------------------------------------------
// Données fictives marocaines
// ------------------------------------------------------------------
const boyNames = ["Adam", "Rayan", "Yassine", "Omar", "Amine", "Mehdi", "Ilyas", "Zakaria", "Hamza", "Anas", "Ayoub", "Reda", "Saad", "Taha", "Younes"];
const girlNames = ["Lina", "Salma", "Aya", "Nour", "Yasmine", "Malak", "Rania", "Hiba", "Kenza", "Imane", "Sofia", "Zineb", "Meryem", "Douae", "Ghita"];
const lastNames = ["El Amrani", "Benjelloun", "Chraibi", "El Idrissi", "Bennis", "Tazi", "Alaoui", "Berrada", "Sqalli", "Lahlou", "Bouazza", "Cherkaoui", "Ouazzani", "Benkirane", "El Malki", "Naciri", "Kettani", "Belghiti", "Ziani", "Haddaoui", "Bennani", "Skalli", "Filali", "Guessous", "Andaloussi", "Lazrak", "Tahiri", "Benslimane"];
const phone = () => `06${randInt(10000000, 99999999)}`;

const levelsDef = [
  { name: "CP", order: 1, fee: 800 },
  { name: "CE1", order: 2, fee: 850 },
  { name: "CE2", order: 3, fee: 900 },
];
const classesDef = [
  { name: "CP-A", level: "CP" },
  { name: "CE1-A", level: "CE1" },
  { name: "CE2-A", level: "CE2" },
];
const subjectsDef = ["Arabe", "Français", "Mathématiques", "Éveil scientifique", "Éducation islamique", "Anglais"];

const teachersDef = [
  { email: "enseignant@demo.ma", first: "Karim", last: "Bennani", subjects: ["Français"] },
  { email: "amina.tazi@demo.ma", first: "Amina", last: "Tazi", subjects: ["Arabe", "Éducation islamique"] },
  { email: "youssef.alami@demo.ma", first: "Youssef", last: "Alami", subjects: ["Mathématiques", "Éveil scientifique"] },
  { email: "salma.idrissi@demo.ma", first: "Salma", last: "Idrissi", subjects: ["Anglais"] },
];

async function createUser(email, meta) {
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser ${email} : ${error.message}`);
  return { id: data.user.id, email, ...meta };
}

async function insert(table, rows) {
  for (let i = 0; i < rows.length; i += 400) {
    const { error } = await db.from(table).insert(rows.slice(i, i + 400));
    if (error) throw new Error(`insert ${table} : ${error.message}`);
  }
}

async function main() {
  console.log(`Année scolaire : ${academicYear} (aujourd'hui : ${todayISO})`);

  // ----------------------------------------------------------------
  // Nettoyage : école de démo existante + comptes @demo.ma
  // ----------------------------------------------------------------
  console.log("Nettoyage de l'ancienne démo…");
  const { data: oldSchools } = await db
    .from("schools")
    .select("id")
    .eq("name", SCHOOL_NAME);
  for (const school of oldSchools ?? []) {
    await db.from("schools").delete().eq("id", school.id);
  }
  const demoUsers = [];
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers : ${error.message}`);
    demoUsers.push(...data.users.filter((u) => u.email?.endsWith("@demo.ma")));
    if (data.users.length < 200) break;
  }
  for (const user of demoUsers) {
    const { error } = await db.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`deleteUser ${user.email} : ${error.message}`);
  }

  // ----------------------------------------------------------------
  // École, niveaux, classes, matières, trimestres
  // ----------------------------------------------------------------
  console.log("Création de l'école…");
  const { data: school, error: schoolError } = await db
    .from("schools")
    .insert({
      name: SCHOOL_NAME,
      address: "12, rue Ibn Batouta, Quartier Palmier, Casablanca",
      phone: "05 22 25 41 78",
      email: "contact@alamal.ma",
      academic_year: academicYear,
    })
    .select()
    .single();
  if (schoolError) throw new Error(schoolError.message);
  const schoolId = school.id;

  const levels = levelsDef.map((l) => ({
    school_id: schoolId,
    name: l.name,
    display_order: l.order,
    default_monthly_fee: l.fee,
  }));
  await insert("levels", levels);
  const { data: levelRows } = await db.from("levels").select("*").eq("school_id", schoolId);
  const levelByName = Object.fromEntries(levelRows.map((l) => [l.name, l]));

  await insert(
    "classes",
    classesDef.map((c) => ({
      school_id: schoolId,
      level_id: levelByName[c.level].id,
      name: c.name,
      academic_year: academicYear,
    }))
  );
  const { data: classRows } = await db.from("classes").select("*").eq("school_id", schoolId);
  const classByName = Object.fromEntries(classRows.map((c) => [c.name, c]));

  await insert(
    "subjects",
    subjectsDef.map((name) => ({ school_id: schoolId, name }))
  );
  const { data: subjectRows } = await db.from("subjects").select("*").eq("school_id", schoolId);
  const subjectByName = Object.fromEntries(subjectRows.map((s) => [s.name, s]));

  await insert(
    "terms",
    termsDef.map((t) => ({
      school_id: schoolId,
      name: t.name,
      academic_year: academicYear,
      start_date: t.start,
      end_date: t.end,
    }))
  );
  const { data: termRows } = await db
    .from("terms")
    .select("*")
    .eq("school_id", schoolId)
    .order("start_date");

  // ----------------------------------------------------------------
  // Comptes : direction, enseignants, parents
  // ----------------------------------------------------------------
  console.log("Création des comptes…");
  const admin = await createUser("admin@demo.ma", { first: "Nadia", last: "El Mansouri" });
  await insert("profiles", [
    {
      id: admin.id,
      school_id: schoolId,
      role: "admin",
      first_name: admin.first,
      last_name: admin.last,
      email: admin.email,
      phone: phone(),
    },
  ]);

  const teachers = [];
  for (const teacherDef of teachersDef) {
    const user = await createUser(teacherDef.email, teacherDef);
    teachers.push(user);
  }
  await insert(
    "profiles",
    teachers.map((teacher) => ({
      id: teacher.id,
      school_id: schoolId,
      role: "teacher",
      first_name: teacher.first,
      last_name: teacher.last,
      email: teacher.email,
      phone: phone(),
    }))
  );

  // Affectations : chaque enseignant couvre ses matières dans les 3 classes
  const assignments = [];
  for (const teacher of teachers) {
    for (const subjectName of teacher.subjects) {
      for (const classRow of classRows) {
        assignments.push({
          school_id: schoolId,
          teacher_id: teacher.id,
          class_id: classRow.id,
          subject_id: subjectByName[subjectName].id,
        });
      }
    }
  }
  await insert("teacher_assignments", assignments);

  // ----------------------------------------------------------------
  // Élèves et parents — 10 par classe ; parent@demo.ma a 2 enfants
  // ----------------------------------------------------------------
  console.log("Création des élèves et des parents…");
  const students = [];
  const parents = [];
  const usedNames = new Set();

  const demoParent = await createUser("parent@demo.ma", {
    first: "Fatima Zahra",
    last: "El Fassi",
  });
  parents.push({ ...demoParent, phone: phone() });

  const demoChildren = [
    { classe: "CP-A", gender: "F", first: "Aya" },
    { classe: "CE2-A", gender: "M", first: "Adam" },
  ];
  for (const child of demoChildren) {
    students.push({
      first_name: child.first,
      last_name: "El Fassi",
      gender: child.gender,
      class: classByName[child.classe],
      parent: demoParent,
      ability: 13.5,
    });
  }

  let parentIndex = 0;
  for (const classDef of classesDef) {
    const classRow = classByName[classDef.name];
    const target = classDef.name === "CP-A" || classDef.name === "CE2-A" ? 9 : 10;
    for (let i = 0; i < target; i++) {
      const gender = rand() < 0.5 ? "M" : "F";
      const firstName = gender === "M" ? pick(boyNames) : pick(girlNames);
      let lastName = pick(lastNames);
      while (usedNames.has(`${firstName} ${lastName}`)) lastName = pick(lastNames);
      usedNames.add(`${firstName} ${lastName}`);

      parentIndex++;
      const parentFirst = gender === "M" ? pick(["Hassan", "Abdellah", "Mohammed", "Rachid", "Khalid", "Driss", "Said", "Jamal"]) : pick(["Hassan", "Mohammed", "Karim", "Mustapha", "Abdelilah", "Nabil", "Fouad", "Hicham"]);
      const parentEmail = `parent${parentIndex}@demo.ma`;
      const parentUser = await createUser(parentEmail, {
        first: parentFirst,
        last: lastName,
      });
      parents.push({ ...parentUser, phone: phone() });

      students.push({
        first_name: firstName,
        last_name: lastName,
        gender,
        class: classRow,
        parent: parentUser,
        ability: 8 + rand() * 9, // niveau latent de l'élève (8 → 17)
      });
    }
  }

  await insert(
    "profiles",
    parents.map((parent) => ({
      id: parent.id,
      school_id: schoolId,
      role: "parent",
      first_name: parent.first,
      last_name: parent.last,
      email: parent.email,
      phone: parent.phone,
    }))
  );

  const birthYearByLevel = { "CP-A": startYear - 6, "CE1-A": startYear - 7, "CE2-A": startYear - 8 };
  await insert(
    "students",
    students.map((student) => ({
      school_id: schoolId,
      class_id: student.class.id,
      parent_id: student.parent.id,
      first_name: student.first_name,
      last_name: student.last_name,
      gender: student.gender,
      birth_date: iso(birthYearByLevel[student.class.name], randInt(1, 12), randInt(1, 28)),
      phone: phone(),
      // Deux élèves bénéficient d'un tarif préférentiel
      monthly_fee: rand() < 0.07 ? 700 : null,
      is_active: true,
    }))
  );
  const { data: studentRows } = await db
    .from("students")
    .select("*")
    .eq("school_id", schoolId);
  const studentRecord = new Map(
    studentRows.map((row) => [
      `${row.first_name}|${row.last_name}`,
      row,
    ])
  );
  for (const student of students) {
    student.row = studentRecord.get(`${student.first_name}|${student.last_name}`);
  }

  // ----------------------------------------------------------------
  // Notes — pour chaque trimestre commencé : 2 contrôles (coef 1)
  // + 1 évaluation (coef 2), par classe et par matière
  // ----------------------------------------------------------------
  console.log("Saisie des notes…");
  const teacherBySubject = {};
  for (const teacher of teachers) {
    for (const subjectName of teacher.subjects) {
      teacherBySubject[subjectName] = teacher;
    }
  }

  const grades = [];
  for (const term of termRows) {
    if (term.start_date > todayISO) continue;
    const termEnd = term.end_date < todayISO ? term.end_date : todayISO;
    for (const classRow of classRows) {
      const classStudents = students.filter((s) => s.class.id === classRow.id);
      for (const subjectName of subjectsDef) {
        const controls = [
          { title: "Contrôle 1", coefficient: 1, at: 0.3 },
          { title: "Contrôle 2", coefficient: 1, at: 0.6 },
          { title: "Évaluation", coefficient: 2, at: 0.9 },
        ];
        for (const control of controls) {
          const start = new Date(term.start_date);
          const end = new Date(termEnd);
          const when = new Date(
            start.getTime() + (end.getTime() - start.getTime()) * control.at
          );
          const gradedOn = when.toISOString().slice(0, 10);
          if (gradedOn > todayISO) continue;
          for (const student of classStudents) {
            const noise = (rand() - 0.5) * 5;
            const score = Math.min(20, Math.max(2, Math.round((student.ability + noise) * 2) / 2));
            grades.push({
              school_id: schoolId,
              student_id: student.row.id,
              class_id: classRow.id,
              subject_id: subjectByName[subjectName].id,
              teacher_id: teacherBySubject[subjectName].id,
              term_id: term.id,
              title: control.title,
              score,
              coefficient: control.coefficient,
              graded_on: gradedOn,
            });
          }
        }
      }
    }
  }
  await insert("grades", grades);
  console.log(`  ${grades.length} notes`);

  // ----------------------------------------------------------------
  // Absences & retards répartis sur les mois écoulés
  // ----------------------------------------------------------------
  console.log("Saisie des absences…");
  const attendance = [];
  const attendanceKeys = new Set();
  for (const monthFirst of billedMonths) {
    for (const student of students) {
      if (rand() < 0.18) {
        const days = rand() < 0.25 ? 2 : 1;
        for (let d = 0; d < days; d++) {
          const date = schoolDay(monthFirst);
          if (!date) continue;
          const key = `${student.row.id}|${date}|absence`;
          if (attendanceKeys.has(key)) continue;
          attendanceKeys.add(key);
          attendance.push({
            school_id: schoolId,
            student_id: student.row.id,
            class_id: student.class.id,
            date,
            type: "absence",
            justified: rand() < 0.45,
            recorded_by: teachers[0].id,
          });
        }
      }
      if (rand() < 0.12) {
        const date = schoolDay(monthFirst);
        if (!date) continue;
        const key = `${student.row.id}|${date}|late`;
        if (attendanceKeys.has(key)) continue;
        attendanceKeys.add(key);
        attendance.push({
          school_id: schoolId,
          student_id: student.row.id,
          class_id: student.class.id,
          date,
          type: "late",
          justified: false,
          recorded_by: teachers[0].id,
        });
      }
    }
  }
  await insert("attendance", attendance);
  console.log(`  ${attendance.length} enregistrements`);

  // ----------------------------------------------------------------
  // Mensualités — payées sauf sur les derniers mois (impayés démo)
  // ----------------------------------------------------------------
  console.log("Création des mensualités…");
  const payments = [];
  const lastMonth = billedMonths[billedMonths.length - 1];
  const secondLast = billedMonths[billedMonths.length - 2];
  const thirdLast = billedMonths[billedMonths.length - 3];

  for (const monthFirst of billedMonths) {
    for (const student of students) {
      const fee =
        student.row.monthly_fee ??
        levelByName[classesDef.find((c) => c.name === student.class.name).level]
          .default_monthly_fee;
      let unpaid = false;
      if (monthFirst === lastMonth) unpaid = rand() < 0.3;
      else if (monthFirst === secondLast) unpaid = rand() < 0.15;
      else if (monthFirst === thirdLast) unpaid = rand() < 0.05;

      const [y, m] = monthFirst.split("-").map(Number);
      const paidDay = iso(y, m, randInt(2, 12));
      payments.push({
        school_id: schoolId,
        student_id: student.row.id,
        month: monthFirst,
        amount: fee,
        status: unpaid ? "unpaid" : "paid",
        paid_at: unpaid ? null : `${paidDay > todayISO ? todayISO : paidDay}T10:00:00Z`,
        method: unpaid ? null : rand() < 0.7 ? "cash" : rand() < 0.65 ? "cheque" : "transfer",
        recorded_by: unpaid ? null : admin.id,
      });
    }
  }

  // Numéros de reçu séquentiels par année civile, dans l'ordre des règlements
  const paid = payments
    .filter((p) => p.status === "paid")
    .sort((a, b) => a.paid_at.localeCompare(b.paid_at));
  const counters = {};
  for (const payment of paid) {
    const year = payment.paid_at.slice(0, 4);
    counters[year] = (counters[year] ?? 0) + 1;
    payment.receipt_number = `REC-${year}-${String(counters[year]).padStart(4, "0")}`;
  }
  await insert("payments", payments);
  const unpaidCount = payments.filter((p) => p.status === "unpaid").length;
  console.log(`  ${payments.length} mensualités dont ${unpaidCount} impayées`);

  // ----------------------------------------------------------------
  // Annonces + une conversation de démo
  // ----------------------------------------------------------------
  console.log("Annonces et messagerie…");
  const recentMonth = lastMonth;
  const [ry, rm] = recentMonth.split("-").map(Number);
  await insert("announcements", [
    {
      school_id: schoolId,
      author_id: admin.id,
      title: "Réunion parents-enseignants",
      body: `Chers parents,\n\nLa réunion parents-enseignants se tiendra le samedi ${iso(ry, rm, 20) <= todayISO ? "20" : "27"} du mois à 9h00 dans la salle polyvalente. Votre présence est vivement souhaitée pour faire le point sur la scolarité de vos enfants.\n\nLa Direction`,
      pinned: true,
      published_at: `${iso(ry, rm, 3)}T09:00:00Z`,
    },
    {
      school_id: schoolId,
      author_id: admin.id,
      title: "Sortie pédagogique au Jardin Majorelle",
      body: "Les classes de CE1 et CE2 participeront à une sortie pédagogique. Le transport et le goûter sont pris en charge par l'école. Merci de signer l'autorisation parentale remise à votre enfant.",
      pinned: false,
      published_at: `${iso(ry, rm, 8) <= todayISO ? iso(ry, rm, 8) : iso(ry, rm, 1)}T14:30:00Z`,
    },
    {
      school_id: schoolId,
      author_id: admin.id,
      title: "Rappel : règlement des mensualités",
      body: "Nous rappelons aux parents que les mensualités doivent être réglées avant le 10 de chaque mois auprès du secrétariat. Merci de votre compréhension.",
      pinned: false,
      published_at: `${iso(ry, rm, 10) <= todayISO ? iso(ry, rm, 10) : iso(ry, rm, 2)}T11:00:00Z`,
    },
  ]);

  const { data: conversation } = await db
    .from("conversations")
    .insert({
      school_id: schoolId,
      parent_id: demoParent.id,
      subject: "Absence d'Aya jeudi prochain",
    })
    .select()
    .single();
  await insert("messages", [
    {
      school_id: schoolId,
      conversation_id: conversation.id,
      sender_id: demoParent.id,
      body: "Bonjour, ma fille Aya a un rendez-vous médical jeudi prochain. Elle sera absente toute la matinée. Merci de bien vouloir l'excuser.",
      read_at: new Date().toISOString(),
    },
    {
      school_id: schoolId,
      conversation_id: conversation.id,
      sender_id: admin.id,
      body: "Bonjour Madame El Fassi, c'est bien noté. L'absence sera marquée comme justifiée. Bonne journée.",
    },
  ]);

  console.log("\n✔ Démo prête !");
  console.log(`  École   : ${SCHOOL_NAME} (${academicYear})`);
  console.log(`  Comptes : admin@demo.ma / enseignant@demo.ma / parent@demo.ma`);
  console.log(`  Mot de passe : ${PASSWORD}`);
}

main().catch((error) => {
  console.error("Échec du seed :", error.message);
  process.exit(1);
});
