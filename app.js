import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyClroxydGdxlAHul08SeYrNlVgqXY9drKE",
  authDomain: "test-e69c4.firebaseapp.com",
  projectId: "test-e69c4",
  storageBucket: "test-e69c4.appspot.com",
  messagingSenderId: "102070631826",
  appId: "1:102070631826:web:0007dd69204265baa2154b",
  measurementId: "G-W5H5T8DY6H"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let editingId = null;

// 문제 저장/수정
document.getElementById("questionForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const answer = document.getElementById("answer").value.trim();
  if (!title || !answer) return;

  try {
    if (editingId) {
      await updateDoc(doc(db, "questions", editingId), { title, answer });
      alert("문제가 수정되었습니다!");
      editingId = null;
    } else {
      await addDoc(collection(db, "questions"), { title, answer });
      alert("문제가 저장되었습니다!");
    }
    e.target.reset();
    loadQuestions();
  } catch (err) {
    console.error("오류:", err);
    alert("저장 실패");
  }
});

// 문제 삭제
async function deleteQuestion(id) {
  try {
    await deleteDoc(doc(db, "questions", id));
    alert("문제가 삭제되었습니다!");
    loadQuestions();
  } catch (err) {
    console.error("삭제 실패:", err);
    alert("삭제 중 오류 발생");
  }
}

// 문제 목록 불러오기
async function loadQuestions() {
  const container = document.getElementById("questionList");
  container.innerHTML = "";

  try {
    const snapshot = await getDocs(collection(db, "questions"));
    const allQuestions = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    for (let i = 0; i < allQuestions.length; i += 10) {
      const group = document.createElement("div");
      group.className = "question-group";
      group.innerHTML = `<h3>📦 문제 묶음 ${Math.floor(i / 10) + 1}</h3>`;

      const groupList = document.createElement("ul");
      groupList.style.display = "none";

      allQuestions.slice(i, i + 10).forEach((q, idx) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <div class="question-title">Q${i + idx + 1}: ${q.title}</div>
          <div class="question-answer">정답: ${q.answer}</div>
          <button class="edit-btn" data-id="${q.id}">수정</button>
          <button class="delete-btn" data-id="${q.id}">삭제</button>
        `;

        li.querySelector(".edit-btn").addEventListener("click", () => {
          document.getElementById("title").value = q.title;
          document.getElementById("answer").value = q.answer;
          editingId = q.id;
        });

        li.querySelector(".delete-btn").addEventListener("click", () => {
          if (confirm("정말 삭제하시겠습니까?")) {
            deleteQuestion(q.id);
          }
        });

        groupList.appendChild(li);
      });

      const header = group.querySelector("h3");
      header.addEventListener("click", () => {
        groupList.style.display = groupList.style.display === "none" ? "block" : "none";
      });

      group.appendChild(groupList);
      container.appendChild(group);
    }
  } catch (err) {
    console.error("불러오기 실패:", err);
  }
}

// 시험 시작
document.getElementById("startTestBtn").addEventListener("click", async () => {
  try {
    const snapshot = await getDocs(collection(db, "questions"));
    const questions = snapshot.docs.map((doc) => doc.data());

    if (questions.length === 0) {
      alert("저장된 문제가 없습니다.");
      return;
    }

    localStorage.setItem("questions", JSON.stringify(questions));
    window.open("exam.html", "TestWindow", "width=600,height=550");
  } catch (err) {
    console.error("시험 로딩 오류:", err);
    alert("시험을 시작할 수 없습니다.");
  }
});

// 이미지 붙여넣기 처리 함수 (공통)
function enableImagePaste(textareaId) {
  const area = document.getElementById(textareaId);

  area.addEventListener("paste", (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result;
          const imgTag = `<img src="${base64}" alt="이미지" style="max-width:100%;">`;

          const start = area.selectionStart;
          const end = area.selectionEnd;
          const text = area.value;

          area.value = text.slice(0, start) + imgTag + text.slice(end);
          area.selectionStart = area.selectionEnd = start + imgTag.length;
        };
        reader.readAsDataURL(file);
      }
    }
  });
}

// 이미지 붙여넣기 활성화
enableImagePaste("title");
enableImagePaste("answer");

// 초기 로딩
loadQuestions();
