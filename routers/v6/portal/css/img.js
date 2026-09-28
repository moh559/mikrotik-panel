var cachedImages = [];
var imagesLoaded = false;
var sliderIntervals = {};

function img() {
    if (imagesLoaded && cachedImages.length > 0) {
        initializeAllSliders();
        return;
    }
    
    const url = `data/images.json?t=${Date.now()}`;
    
    CacheManager.fetchWithCache(url, 'cached_images')
        .then(data => {
            if (!data) return;
            
            cachedImages = Array.isArray(data) ? data : (data.images || []);
            if (cachedImages.length === 0) return;
            
            imagesLoaded = true;
            initializeAllSliders();
        })
        .catch(error => {
            console.warn('فشل تحميل الصور:', error);
        });
}

function initializeAllSliders() {
    // إيقاف جميع الفترات الزمنية القديمة
    Object.keys(sliderIntervals).forEach(key => {
        if (sliderIntervals[key]) {
            clearInterval(sliderIntervals[key]);
            sliderIntervals[key] = null;
        }
    });
    
    initializeSlider("slider-container-top", "image-indicator-top", "prev-button-top", "next-button-top");
    initializeSlider("slider-container", "image-indicator-vewu", "prev-buttonvewu", "next-buttonvewu");
    initializeSlider("image-slider", "image-indicator", "prev-button", "next-button");
    initializeProSlider("image-slider2", 105);
    initializeProSlider("image-slider-top", 105);
}

function initializeSlider(sliderId, indicatorId, prevBtnId, nextBtnId) {
    const sliderContainer = document.getElementById(sliderId);
    const indicator = document.getElementById(indicatorId);
    
    if (!sliderContainer || !indicator) return;
    
    let currentIndex = 0;
    
    // إزالة الصور والمؤشرات القديمة
    sliderContainer.querySelectorAll("img").forEach(img => img.remove());
    indicator.innerHTML = "";
    
    // إذا لم توجد صور، اخرج
    if (cachedImages.length === 0) return;
    
    cachedImages.forEach((imageData, index) => {
        const img = document.createElement("img");
        img.src = `${sp}${imageData.image_path}`;
        img.style.display = index === 0 ? "block" : "none";
        sliderContainer.appendChild(img);
        
        const dot = document.createElement("span");
        dot.className = index === 0 ? "active" : "";
        dot.dataset.index = index;
        dot.addEventListener("click", () => goToSlide(index));
        indicator.appendChild(dot);
    });
    
    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);
    
    // إزالة المستمعين القدامى بإعادة إنشاء الأزرار
    if (prevBtn) {
        var newPrevBtn = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        newPrevBtn.addEventListener("click", () => changeSlide("prev"));
    }
    if (nextBtn) {
        var newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        newNextBtn.addEventListener("click", () => changeSlide("next"));
    }
    
    // بدء التمرير التلقائي
    sliderIntervals[sliderId] = setInterval(() => {
        changeSlide("next");
    }, 7000);
    
    function changeSlide(direction) {
        const images = sliderContainer.getElementsByTagName("img");
        if (images.length === 0) return;
        
        if (images[currentIndex]) images[currentIndex].style.display = "none";
        if (indicator.children[currentIndex]) indicator.children[currentIndex].classList.remove("active");
        
        if (direction === "next") {
            currentIndex = (currentIndex + 1) % images.length;
        } else if (direction === "prev") {
            currentIndex = (currentIndex - 1 + images.length) % images.length;
        }
        
        if (images[currentIndex]) images[currentIndex].style.display = "block";
        if (indicator.children[currentIndex]) indicator.children[currentIndex].classList.add("active");
    }
    
    function goToSlide(index) {
        const images = sliderContainer.getElementsByTagName("img");
        if (images.length === 0 || index >= images.length) return;
        
        if (images[currentIndex]) images[currentIndex].style.display = "none";
        if (indicator.children[currentIndex]) indicator.children[currentIndex].classList.remove("active");
        
        currentIndex = index;
        
        if (images[currentIndex]) images[currentIndex].style.display = "block";
        if (indicator.children[currentIndex]) indicator.children[currentIndex].classList.add("active");
    }
}

function initializeProSlider(sliderId, radius) {
    const root = document.getElementById(sliderId);
    if (!root) return;
    const carousel = root.querySelector(".carousel");
    if (!carousel) return;
    if (!radius) radius = 180;
    
    carousel.querySelectorAll("img").forEach(img => img.remove());
    
    if (cachedImages.length === 0) return;
    
    const angleStep = 360 / cachedImages.length;
    carousel.innerHTML = "";
    
    cachedImages.forEach((imageData, index) => {
        const slide = document.createElement("div");
        slide.classList.add("slide");
        slide.style.transform = `rotateY(${index * angleStep}deg) translateZ(${radius}px)`;
        slide.innerHTML = `<img src="${sp}${imageData.image_path}" alt="Image ${index + 1}">`;
        carousel.appendChild(slide);
    });
}

window.addEventListener('cacheUpdated', function(e) {
    if (e.detail.key === 'cached_images') {
        var newData = e.detail.data;
        cachedImages = Array.isArray(newData) ? newData : (newData && newData.images ? newData.images : []);
        imagesLoaded = cachedImages.length > 0;
        // إعادة تهيئة جميع السلايدرز بالصور الجديدة
        initializeAllSliders();
    }
});

if (typeof CacheManager !== 'undefined') {
    img();
} else {
    setTimeout(img, 100);
}
