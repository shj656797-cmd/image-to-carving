// 配置
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_CANVAS_SIZE = 2000; // 最大画布尺寸

// DOM 元素
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const effectType = document.getElementById('effectType');
const intensitySlider = document.getElementById('intensitySlider');
const intensityValue = document.getElementById('intensityValue');
const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const originalCanvas = document.getElementById('originalCanvas');
const processedCanvas = document.getElementById('processedCanvas');
const originalPlaceholder = document.getElementById('originalPlaceholder');
const processedPlaceholder = document.getElementById('processedPlaceholder');
const statusBar = document.getElementById('statusBar');
const statusText = document.getElementById('statusText');
const additionalControls = document.getElementById('additionalControls');

// 状态变量
let currentImage = null;
let currentImageFile = null;
let processedCanvas2D = null;
let processor = null;

// ==================== 事件监听 ====================

// 上传区域点击
uploadArea.addEventListener('click', () => imageInput.click());

// 文件输入变化
imageInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
        handleFileUpload(files[0]);
    }
});

// 拖拽功能
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileUpload(files[0]);
    }
});

// 强度调整
intensitySlider.addEventListener('input', (e) => {
    intensityValue.textContent = parseFloat(e.target.value).toFixed(1);
    // 自动重新处理
    if (currentImage) {
        processImage();
    }
});

// 效果切换
effectType.addEventListener('change', () => {
    updateAdditionalControls();
    if (currentImage) {
        processImage();
    }
});

// 处理按钮
processBtn.addEventListener('click', processImage);

// 下载按钮
downloadBtn.addEventListener('click', downloadImage);

// 重置按钮
resetBtn.addEventListener('click', resetAll);

// ==================== 核心函数 ====================

/**
 * 处理文件上传
 */
function handleFileUpload(file) {
    if (!validateFile(file)) {
        return;
    }

    currentImageFile = file;
    const reader = new FileReader();

    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            displayOriginalImage(img);
            processBtn.disabled = false;
            originalPlaceholder.style.display = 'none';
            processImage();
        };
        img.onerror = () => {
            showStatus('图片加载失败，请尝试其他图片', 'error');
        };
        img.src = e.target.result;
    };

    reader.onerror = () => {
        showStatus('文件读取失败', 'error');
    };

    reader.readAsDataURL(file);
}

/**
 * 验证文件
 */
function validateFile(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
        showStatus('仅支持 JPEG、PNG、WebP 和 GIF 格式的图片', 'error');
        return false;
    }

    if (file.size > MAX_FILE_SIZE) {
        showStatus('文件大小不能超过 50MB', 'error');
        return false;
    }

    return true;
}

/**
 * 显示原始图片
 */
function displayOriginalImage(img) {
    const ctx = originalCanvas.getContext('2d');
    const container = originalCanvas.parentElement;
    const maxWidth = container.offsetWidth - 20;
    const maxHeight = 350;

    let width = img.width;
    let height = img.height;

    if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
    }

    originalCanvas.width = width;
    originalCanvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
}

/**
 * 处理图片
 */
function processImage() {
    if (!currentImage) {
        showStatus('请先上传图片', 'error');
        return;
    }

    processBtn.disabled = true;
    showStatus('处理中...', 'loading');

    // 使用 requestAnimationFrame 来避免阻塞
    setTimeout(() => {
        try {
            // 初始化处理器
            if (!processor) {
                processor = new ImageProcessor();
            }

            // 获取参数
            const effect = effectType.value;
            const intensity = parseFloat(intensitySlider.value);
            const options = getAdditionalParams();

            // 计算合适的尺寸
            let width = currentImage.width;
            let height = currentImage.height;
            let scale = 1;

            if (width > MAX_CANVAS_SIZE || height > MAX_CANVAS_SIZE) {
                scale = MAX_CANVAS_SIZE / Math.max(width, height);
                width = Math.round(width * scale);
                height = Math.round(height * scale);
            }

            // 处理图片
            const imageData = processor.process(
                currentImage,
                width,
                height,
                effect,
                intensity,
                options
            );

            // 显示处理结果
            displayProcessedImage(imageData, width, height);
            downloadBtn.disabled = false;
            processedPlaceholder.style.display = 'none';
            showStatus('处理完成！', 'success');
        } catch (error) {
            console.error('处理失败:', error);
            showStatus(`处理失败: ${error.message}`, 'error');
        } finally {
            processBtn.disabled = false;
        }
    }, 0);
}

/**
 * 显示处理后的图片
 */
function displayProcessedImage(imageData, width, height) {
    const ctx = processedCanvas.getContext('2d');
    const container = processedCanvas.parentElement;
    const maxWidth = container.offsetWidth - 20;
    const maxHeight = 350;

    let displayWidth = width;
    let displayHeight = height;

    if (displayWidth > maxWidth || displayHeight > maxHeight) {
        const ratio = Math.min(maxWidth / displayWidth, maxHeight / displayHeight);
        displayWidth *= ratio;
        displayHeight *= ratio;
    }

    processedCanvas.width = displayWidth;
    processedCanvas.height = displayHeight;

    // 创建临时 canvas 用于放置原始大小的图像数据
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(imageData, 0, 0);

    // 缩放显示
    ctx.drawImage(tempCanvas, 0, 0, displayWidth, displayHeight);
    processedCanvas2D = tempCanvas;
}

/**
 * 下载图片
 */
function downloadImage() {
    if (!processedCanvas2D) {
        showStatus('没有可下载的图片', 'error');
        return;
    }

    // 创建下载链接
    const link = document.createElement('a');
    link.href = processedCanvas2D.toDataURL('image/png');
    link.download = `carving_${effectType.value}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showStatus('图片已下载！', 'success');
}

/**
 * 重置所有
 */
function resetAll() {
    currentImage = null;
    currentImageFile = null;
    processedCanvas2D = null;
    imageInput.value = '';

    originalCanvas.width = 0;
    originalCanvas.height = 0;
    processedCanvas.width = 0;
    processedCanvas.height = 0;

    originalPlaceholder.style.display = 'block';
    processedPlaceholder.style.display = 'block';

    processBtn.disabled = true;
    downloadBtn.disabled = true;
    intensitySlider.value = 1;
    intensityValue.textContent = '1.0';
    effectType.value = 'grayscale';

    updateAdditionalControls();
    showStatus('已重置', 'success');
}

/**
 * 显示状态信息
 */
function showStatus(message, type = 'info') {
    statusText.textContent = message;
    statusBar.style.display = 'block';

    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            statusBar.style.display = 'none';
        }, 3000);
    }
}

/**
 * 更新额外控制项
 */
function updateAdditionalControls() {
    additionalControls.innerHTML = '';
    const effect = effectType.value;

    if (effect === 'emboss') {
        additionalControls.innerHTML = `
            <div class="control-group">
                <label for="embossAngle">浮雕角度：</label>
                <div class="slider-container">
                    <input type="range" id="embossAngle" min="0" max="360" step="5" value="45">
                    <span id="embossAngleValue">45°</span>
                </div>
            </div>
        `;
        const angleSlider = document.getElementById('embossAngle');
        const angleValue = document.getElementById('embossAngleValue');
        angleSlider.addEventListener('input', (e) => {
            angleValue.textContent = e.target.value + '°';
            if (currentImage) {
                processImage();
            }
        });
    } else if (effect === 'woodcarving') {
        additionalControls.innerHTML = `
            <div class="control-group">
                <label for="woodPattern">纹理风格：</label>
                <select id="woodPattern">
                    <option value="horizontal">横向纹理</option>
                    <option value="vertical">纵向纹理</option>
                    <option value="diagonal">斜向纹理</option>
                </select>
            </div>
        `;
        const patternSelect = document.getElementById('woodPattern');
        patternSelect.addEventListener('change', () => {
            if (currentImage) {
                processImage();
            }
        });
    }
}

/**
 * 获取额外参数
 */
function getAdditionalParams() {
    const params = {};
    const effect = effectType.value;

    if (effect === 'emboss') {
        const angleInput = document.getElementById('embossAngle');
        if (angleInput) {
            params.angle = parseInt(angleInput.value);
        }
    } else if (effect === 'woodcarving') {
        const patternInput = document.getElementById('woodPattern');
        if (patternInput) {
            params.pattern = patternInput.value;
        }
    }

    return params;
}

// ==================== 页面加载 ====================

window.addEventListener('DOMContentLoaded', () => {
    updateAdditionalControls();
});
