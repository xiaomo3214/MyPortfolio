document.addEventListener("DOMContentLoaded", () => {

    const portfolioList = document.getElementById("portfolio-list");
    const filterList = document.getElementById("filter-list");
    const modal = document.getElementById("portfolio-modal");
    const modalClose = document.getElementById("modal-close");

    const modalTitle = document.getElementById("modal-title");
    const modalCategory = document.getElementById("modal-category");
    const modalDescription = document.getElementById("modal-description");

    const modalVideoContainer = document.getElementById("modal-video-container");
    const modalYoutube = document.getElementById("modal-youtube");

    const modalImageContainer = document.getElementById("modal-image-container");
    const modalImage = document.getElementById("modal-image");

    const modalTechnologies = document.getElementById("modal-technologies");
    const modalDetails = document.getElementById("modal-details");

    const emptyMessage = document.getElementById("empty-message");

    let projects = [];
    let previousFocusedElement = null;


    // =========================
    // 讀取 JSON
    // =========================

    async function loadWebsiteData() {

        try {

            const response = await fetch("./data.json");

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();

            initializeWebsite(data);

        } catch (error) {

            console.error("讀取 data.json 失敗：", error);

            portfolioList.textContent =
                "網站資料載入失敗，請確認 data.json 路徑及伺服器設定。";

        }

    }


    // =========================
    // 初始化網站
    // =========================

    function initializeWebsite(data) {

        projects = Array.isArray(data.projects) ? data.projects : [];

        renderProfile(data.profile);
        renderSkills(data.skills);
        renderCategories(data.categories);
        renderProjects(projects);
        renderContact(data.contact);
        renderFooter(data.footer);

        initializeNavigation();

    }


    // =========================
    // Hero / About
    // =========================

    function renderProfile(profile = {}) {

        setText("hero-eyebrow", profile.eyebrow);
        setText("hero-title", profile.heroTitle);
        setText("hero-description", profile.heroDescription);

        setText("hero-side-text", profile.heroSideText);

        setText("about-title", profile.aboutTitle);
        setText("about-description", profile.aboutDescription);
        setText("education-text", profile.education);

    }


    function renderSkills(skills = []) {

        const container = document.getElementById("skills-list");

        container.replaceChildren();

        skills.forEach(skill => {

            const tag = document.createElement("span");

            tag.className = "skill-tag";
            tag.textContent = skill;

            container.appendChild(tag);

        });

    }


    // =========================
    // 分類按鈕
    // =========================

    function renderCategories(categories = []) {

        filterList.replaceChildren();

        categories.forEach((category, index) => {

            const button = document.createElement("button");

            button.type = "button";
            button.className = "filter-button";

            if (index === 0) {
                button.classList.add("active");
            }

            button.textContent = category.label;
            button.dataset.category = category.id;

            button.addEventListener("click", () => {

                filterList
                    .querySelectorAll(".filter-button")
                    .forEach(item => item.classList.remove("active"));

                button.classList.add("active");

                filterProjects(category.id);

            });

            filterList.appendChild(button);

        });

    }


    // =========================
    // 作品卡片
    // =========================

    function renderProjects(projectData = []) {

        portfolioList.replaceChildren();

        projectData.forEach(project => {

            const card = document.createElement("button");

            card.type = "button";
            card.className = "project-card";

            card.setAttribute(
                "aria-label",
                `查看作品：${project.title || "未命名作品"}`
            );

            // 圖片區域
            const imageWrapper = document.createElement("div");
            imageWrapper.className = "card-image";

            const image = document.createElement("img");

            image.src = project.image || "";
            image.alt = project.imageAlt || project.title || "作品圖片";
            image.loading = "lazy";

            imageWrapper.appendChild(image);

            const overlay = document.createElement("div");
            overlay.className = "card-overlay";

            const overlayText = document.createElement("span");
            overlayText.textContent = "VIEW PROJECT ↗";

            overlay.appendChild(overlayText);
            imageWrapper.appendChild(overlay);


            // 文字資訊
            const info = document.createElement("div");
            info.className = "card-info";

            const meta = document.createElement("div");
            meta.className = "card-meta";

            const category = document.createElement("span");
            category.textContent = project.tag || "";

            const year = document.createElement("span");
            year.textContent = project.year || "";

            meta.append(category, year);

            const title = document.createElement("h3");
            title.className = "card-title";
            title.textContent = project.title || "";

            const description = document.createElement("p");
            description.className = "card-description";
            description.textContent = project.description || "";

            info.append(meta, title, description);

            card.append(imageWrapper, info);

            card.addEventListener("click", () => {
                openModal(project, card);
            });

            portfolioList.appendChild(card);

        });

        emptyMessage.hidden = projectData.length > 0;

    }


    // =========================
    // 分類篩選
    // =========================

    function filterProjects(categoryId) {

        if (categoryId === "all") {

            renderProjects(projects);

            return;

        }

        const filteredProjects = projects.filter(project => {
            return project.category === categoryId;
        });

        renderProjects(filteredProjects);

    }

    // =========================
    // YouTube 網址轉換
    // =========================

    function getYouTubeEmbedUrl(videoUrl) {

        if (!videoUrl || typeof videoUrl !== "string") {
            return null;
        }

        try {

            const url = new URL(videoUrl);

            const hostname = url.hostname.toLowerCase();

            let videoId = "";

            // youtu.be/影片ID
            if (hostname === "youtu.be") {

                videoId = url.pathname.split("/").filter(Boolean)[0] || "";

            }

            // youtube.com/watch?v=影片ID
            else if (
                hostname === "youtube.com" ||
                hostname === "www.youtube.com" ||
                hostname === "m.youtube.com"
            ) {

                if (url.pathname === "/watch") {

                    videoId = url.searchParams.get("v") || "";

                }

                // youtube.com/embed/影片ID
                else if (url.pathname.startsWith("/embed/")) {

                    videoId = url.pathname.split("/")[2] || "";

                }

                // youtube.com/shorts/影片ID
                else if (url.pathname.startsWith("/shorts/")) {

                    videoId = url.pathname.split("/")[2] || "";

                }

            }

            // 只接受標準 YouTube 影片 ID
            if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
                return null;
            }

            return `https://www.youtube-nocookie.com/embed/${videoId}`;

        } catch (error) {

            console.error("YouTube 網址格式錯誤：", error);

            return null;

        }
    }

    // =========================
    // 開啟 Modal
    // =========================

    function openModal(project, triggerElement) {

        previousFocusedElement = triggerElement;

        modalTitle.textContent = project.title || "";
        modalCategory.textContent = project.tag || "";
        modalDescription.textContent = project.description || "";

        // 清空前一次作品的技術標籤
        modalTechnologies.replaceChildren();

        // 產生技術標籤
        const technologies = Array.isArray(project.technologies)
            ? project.technologies
            : [];

        technologies.forEach(technology => {

            const tag = document.createElement("span");

            tag.className = "tech-tag";
            tag.textContent = technology;

            modalTechnologies.appendChild(tag);

        });


        // 清空前一次作品的詳細內容
        modalDetails.replaceChildren();

        const details = Array.isArray(project.details)
            ? project.details
            : [];

        details.forEach(detail => {

            const item = document.createElement("div");
            item.className = "detail-item";

            const heading = document.createElement("h3");
            heading.textContent = detail.heading || "";

            const content = document.createElement("p");
            content.textContent = detail.content || "";

            item.append(heading, content);

            modalDetails.appendChild(item);

        });


        // =========================
        // 判斷是否有 YouTube 影片
        // =========================

        // 先清除上一部影片
        modalYoutube.src = "";

        modalVideoContainer.hidden = true;
        modalImageContainer.hidden = true;

        const embedUrl = getYouTubeEmbedUrl(project.videoUrl);

        if (embedUrl) {

            // 有有效的 YouTube 網址：顯示影片
            modalYoutube.src = embedUrl;
            modalVideoContainer.hidden = false;

        } else {

            // 沒有影片或網址無效：顯示作品圖片
            if (project.image) {

                modalImage.src = project.image;
                modalImage.alt = project.imageAlt || project.title || "作品圖片";

                modalImageContainer.hidden = false;

            }

        }


        // 顯示 Modal
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");

        document.body.classList.add("modal-open");

        modalClose.focus();

    }


    // =========================
    // 關閉 Modal
    // =========================

    function closeModal() {

        if (!modal.classList.contains("active")) {
            return;
        }

        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");

        document.body.classList.remove("modal-open");

        // 清除 YouTube iframe 來源，停止影片播放
        modalYoutube.src = "";

        modalVideoContainer.hidden = true;

        // 關閉後恢復原本焦點
        if (previousFocusedElement) {
            previousFocusedElement.focus();
            previousFocusedElement = null;
        }

    }


    // =========================
    // Modal 事件
    // =========================

    modalClose.addEventListener("click", closeModal);

    // 點擊背景遮罩關閉
    modal.addEventListener("click", event => {

        if (event.target === modal) {
            closeModal();
        }

    });

    // ESC 關閉
    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {
            closeModal();
        }

    });


    // =========================
    // 聯絡資訊
    // =========================

    function renderContact(contact = {}) {

        setText("contact-title", contact.title);
        setText("contact-description", contact.description);

        const container = document.getElementById("contact-links");

        container.replaceChildren();

        const links = Array.isArray(contact.links)
            ? contact.links
            : [];

        links.forEach(item => {

            if (!item.url) {
                return;
            }

            const link = document.createElement("a");

            link.textContent = item.label || item.name || "Link";
            link.href = item.url;

            if (item.external) {
                link.target = "_blank";
                link.rel = "noopener noreferrer";
            }

            container.appendChild(link);

        });

    }


    // =========================
    // Footer
    // =========================

    function renderFooter(footer = {}) {

        setText("footer-text", footer.text);

    }


    // =========================
    // 共用文字設定
    // =========================

    function setText(elementId, value) {

        const element = document.getElementById(elementId);

        if (element && value !== undefined && value !== null) {
            element.textContent = value;
        }

    }


    // =========================
    // 手機版導覽列
    // =========================

    function initializeNavigation() {

        const menuToggle = document.getElementById("menu-toggle");
        const navLinks = document.getElementById("nav-links");

        menuToggle.addEventListener("click", () => {

            const isOpen = navLinks.classList.toggle("open");

            menuToggle.setAttribute("aria-expanded", String(isOpen));

        });

        navLinks.querySelectorAll("a").forEach(link => {

            link.addEventListener("click", () => {

                navLinks.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");

            });

        });

    }


    // 開始載入網站
    loadWebsiteData();

});