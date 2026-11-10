/* Lashdou × Tiyan Digital — site scripts.
   BUSINESS_NAME is the ONE swappable constant for the salon name.
   Change it here and every element marked [data-biz] updates. */
const BUSINESS_NAME = "Lashdou";

document.addEventListener("DOMContentLoaded", () => {
  /* Swappable business name */
  document.querySelectorAll("[data-biz]").forEach((el) => { el.textContent = BUSINESS_NAME; });

  /* Mobile nav */
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("nav.main");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => nav.classList.remove("open")));
  }

  /* Cookie banner */
  const cookie = document.querySelector(".cookie");
  const cookieBtn = document.querySelector(".cookie button");
  if (cookie && cookieBtn) {
    try {
      if (localStorage.getItem("lashdou-cookie-ok") === "1") cookie.hidden = true;
    } catch (e) { /* storage unavailable: banner stays visible, harmless */ }
    cookieBtn.addEventListener("click", () => {
      cookie.hidden = true;
      try { localStorage.setItem("lashdou-cookie-ok", "1"); } catch (e) { /* ignore */ }
    });
  }

  /* Hero chat: reveal bubbles one by one (calm, message-by-message) */
  const heroChat = document.querySelector("[data-hero-chat]");
  if (heroChat) {
    const bubbles = heroChat.querySelectorAll(".bubble");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bubbles.forEach((b, i) => {
      b.style.animationDelay = reduced ? "0s" : (0.35 + i * 0.7) + "s";
    });
  }

  /* Walkthrough form: no backend on a proposal demo — confirm in place. */
  const form = document.querySelector("[data-walkthrough-form]");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const done = form.querySelector("[data-form-done]");
      if (done) {
        form.querySelectorAll("input, select, textarea, button").forEach((el) => { el.disabled = true; });
        done.hidden = false;
        done.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  initBotDemo();
});

/* ---------------- Bot demo: scenarios A / B / C ----------------
   Every conversation is scripted and tagged "Sample conversation".
   No prices, no invented metrics, no invented people. */
const SCENARIOS = {
  A: {
    label: "Scenario A — New booking",
    messages: [
      { from: "bot", text: "Hello! Welcome to Lashdou at 66 East Coast Road. We'd love to welcome you. Which treatment would you like to book?" },
      { from: "bot", options: [
        { label: "YUMI Lash Lift Keratin", reply: "I'd like the YUMI Lash Lift Keratin, please." },
        { label: "Classic, Hybrid or Volume extensions", reply: "I'd like lash extensions, please." },
        { label: "Eyebrow embroidery", reply: "I'd like eyebrow embroidery, please." }
      ]},
    ],
    flow: [
      { from: "bot", text: "Lovely choice. Here are the open slots this Saturday at our 66 East Coast Road atelier. Tap one to hold it." },
      { from: "bot", slots: ["14:00", "16:30", "18:00"] },
      { from: "bot", text: "Reserved for you — Saturday, 2:00 PM. A calendar invite and pre-care instructions have been sent to you. We can't wait to welcome you." },
      { from: "bot", text: "A gentle reminder: please arrive with clean, makeup-free lashes, and bring your lens case if you wear contact lenses. Reply here any time if plans change." }
    ]
  },
  B: {
    label: "Scenario B — Rescheduling",
    messages: [
      { from: "bot", text: "Hello! Welcome back to Lashdou at 66 East Coast Road. How can we help today?" },
      { from: "client", text: "Hi — I need to move my Saturday appointment. Something came up." },
      { from: "bot", text: "Of course, no trouble at all. Your Saturday 2:00 PM booking is still held while we find a new time. Which of these works for you?" },
      { from: "bot", slots: ["Sunday 11:30", "Sunday 15:00", "Monday 18:00"] },
      { from: "bot", text: "Done — moved to Sunday, 11:30 AM. Your old slot is now free for another client, and your new confirmation and pre-care notes are on their way." }
    ]
  },
  C: {
    label: "Scenario C — No-show recovery",
    messages: [
      { from: "bot", text: "Hello! This is Lashdou at 66 East Coast Road. We missed you at your appointment today and hope everything is all right." },
      { from: "client", text: "I'm so sorry — I got held up at work and couldn't make it." },
      { from: "bot", text: "No worries at all, these things happen. Would you like to rebook? We have a few openings this week." },
      { from: "bot", slots: ["Tomorrow 14:00", "Thursday 16:30", "Saturday 11:00"] },
      { from: "bot", text: "Booked — Thursday, 4:30 PM. And because a slot opened today, we've offered it to the next client on our waitlist, so the chair doesn't sit empty. See you Thursday." }
    ]
  }
};

function initBotDemo() {
  const chat = document.querySelector("[data-demo-chat]");
  const buttons = document.querySelectorAll("[data-scenario]");
  const resetBtn = document.querySelector("[data-demo-reset]");
  if (!chat || !buttons.length) return;

  let timers = [];
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function bubble(msg) {
    const el = document.createElement("div");
    el.className = "bubble " + msg.from;
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = msg.from === "bot" ? "Lashdou Concierge · Sample conversation" : "Client · Sample conversation";
    el.appendChild(tag);
    const body = document.createElement("span");
    body.textContent = msg.text;
    el.appendChild(body);
    const time = document.createElement("span");
    time.className = "time";
    time.textContent = new Date().toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" });
    el.appendChild(time);
    chat.appendChild(el);
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
    return el;
  }

  function slotRow(slots, onPick) {
    const row = document.createElement("div");
    row.className = "slot-row";
    slots.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "slot-btn"; b.textContent = s;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", () => {
        row.querySelectorAll(".slot-btn").forEach((x) => { x.setAttribute("aria-pressed", "false"); x.disabled = true; });
        b.setAttribute("aria-pressed", "true");
        onPick(s);
      });
      row.appendChild(b);
    });
    chat.appendChild(row);
    row.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
    return row;
  }

  function typingBubble() {
    const el = document.createElement("div");
    el.className = "bubble bot";
    el.innerHTML = '<span class="typing" aria-hidden="true"><i></i><i></i><i></i></span>';
    chat.appendChild(el);
    return el;
  }

  function play(key) {
    clearTimers();
    chat.innerHTML = "";
    const sc = SCENARIOS[key];
    const date = document.createElement("div");
    date.className = "chat-date";
    date.textContent = "Today · End-to-end encrypted";
    chat.appendChild(date);

    let delay = 300;
    const step = reduced ? 60 : 850;
    const queue = [...sc.messages];
    const flow = sc.flow ? [...sc.flow] : [];
    let flowStarted = false;

    function next() {
      const msg = queue.shift();
      if (!msg) return;
      if (msg.options) {
        const typing = typingBubble();
        timers.push(setTimeout(() => {
          typing.remove();
          const row = document.createElement("div");
          row.className = "slot-row";
          msg.options.forEach((opt) => {
            const b = document.createElement("button");
            b.type = "button"; b.className = "slot-btn"; b.textContent = opt.label;
            b.addEventListener("click", () => {
              row.querySelectorAll(".slot-btn").forEach((x) => { x.disabled = true; });
              b.setAttribute("aria-pressed", "true");
              bubble({ from: "client", text: opt.reply });
              startFlow();
            });
            row.appendChild(b);
          });
          chat.appendChild(row);
          row.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
        }, reduced ? 60 : 900));
        return;
      }
      if (msg.slots) {
        slotRow(msg.slots, (picked) => {
          bubble({ from: "client", text: picked + " works for me, please." });
          next();
        });
        return;
      }
      const typing = typingBubble();
      timers.push(setTimeout(() => {
        typing.remove();
        bubble(msg);
        next();
      }, reduced ? 60 : 900));
    }

    function startFlow() {
      if (flowStarted) return;
      flowStarted = true;
      queue.push(...flow);
      next();
    }

    timers.push(setTimeout(next, delay));
    // For scenarios B/C the queue drives itself; A waits on the service tap.
    void step;
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      play(btn.dataset.scenario);
    });
  });
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const active = document.querySelector('[data-scenario][aria-pressed="true"]') || buttons[0];
      play(active.dataset.scenario);
    });
  }
  play("A");
}
