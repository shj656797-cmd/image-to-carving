/**
 * 图像处理引擎
 * 提供各种图像处理算法的实现
 */

class ImageProcessor {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }

    /**
     * 获取图像数据
     */
    getImageData(image, width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.drawImage(image, 0, 0, width, height);
        return this.ctx.getImageData(0, 0, width, height);
    }

    /**
     * 创建图像数据
     */
    createImageData(width, height) {
        return this.ctx.createImageData(width, height);
    }

    /**
     * 灰度图处理
     */
    grayscale(image, width, height, intensity) {
        const imageData = this.getImageData(image, width, height);
        const data = imageData.data;
        const factor = Math.min(2, Math.max(0.1, intensity));

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // 计算灰度值
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;

            // 应用强度
            const contrast = gray + (gray - 128) * (factor - 1);
            const value = Math.min(255, Math.max(0, contrast));

            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
        }

        return imageData;
    }

    /**
     * 浮雕效果处理
     */
    emboss(image, width, height, intensity, angle = 45) {
        const imageData = this.getImageData(image, width, height);
        const data = imageData.data;
        const newData = this.createImageData(width, height);
        const newImageData = newData.data;

        // 转换为灰度
        const grayData = new Uint8ClampedArray(width * height);
        for (let i = 0; i < data.length; i += 4) {
            const idx = i / 4;
            grayData[idx] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }

        // Sobel 边缘检测
        const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0, gy = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = (y + ky) * width + (x + kx);
                        const kernelIdx = (ky + 1) * 3 + (kx + 1);
                        gx += grayData[idx] * sobelX[kernelIdx];
                        gy += grayData[idx] * sobelY[kernelIdx];
                    }
                }

                const magnitude = Math.sqrt(gx * gx + gy * gy) * intensity;
                const value = Math.min(255, Math.max(0, magnitude + 128));

                const dataIdx = (y * width + x) * 4;
                newImageData[dataIdx] = value;
                newImageData[dataIdx + 1] = value;
                newImageData[dataIdx + 2] = value;
                newImageData[dataIdx + 3] = 255;
            }
        }

        return newData;
    }

    /**
     * 木雕纹理处理
     */
    woodcarving(image, width, height, intensity, pattern = 'horizontal') {
        const imageData = this.getImageData(image, width, height);
        const data = imageData.data;
        const newData = this.createImageData(width, height);
        const newImageData = newData.data;

        // 转换为灰度
        const grayData = new Uint8ClampedArray(width * height);
        for (let i = 0; i < data.length; i += 4) {
            const idx = i / 4;
            grayData[idx] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }

        // 选择卷积核
        let kernel;
        if (pattern === 'horizontal') {
            kernel = [1, 2, 1, 0, 0, 0, -1, -2, -1];
        } else if (pattern === 'vertical') {
            kernel = [1, 0, -1, 2, 0, -2, 1, 0, -1];
        } else {
            kernel = [2, 1, 0, 1, 0, -1, 0, -1, -2];
        }

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let result = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = (y + ky) * width + (x + kx);
                        const kernelIdx = (ky + 1) * 3 + (kx + 1);
                        result += grayData[idx] * kernel[kernelIdx];
                    }
                }

                const value = Math.min(255, Math.max(0, Math.abs(result) * intensity + 128));

                const dataIdx = (y * width + x) * 4;
                newImageData[dataIdx] = value;
                newImageData[dataIdx + 1] = value;
                newImageData[dataIdx + 2] = value;
                newImageData[dataIdx + 3] = 255;
            }
        }

        return newData;
    }

    /**
     * 边缘检测处理
     */
    edge(image, width, height, intensity) {
        const imageData = this.getImageData(image, width, height);
        const data = imageData.data;
        const newData = this.createImageData(width, height);
        const newImageData = newData.data;

        // 转换为灰度
        const grayData = new Uint8ClampedArray(width * height);
        for (let i = 0; i < data.length; i += 4) {
            const idx = i / 4;
            grayData[idx] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }

        // Canny 边缘检测的简化版本
        const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

        const threshold = 100 / intensity;

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0, gy = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = (y + ky) * width + (x + kx);
                        const kernelIdx = (ky + 1) * 3 + (kx + 1);
                        gx += grayData[idx] * sobelX[kernelIdx];
                        gy += grayData[idx] * sobelY[kernelIdx];
                    }
                }

                const magnitude = Math.sqrt(gx * gx + gy * gy);
                const value = magnitude > threshold ? 0 : 255;

                const dataIdx = (y * width + x) * 4;
                newImageData[dataIdx] = value;
                newImageData[dataIdx + 1] = value;
                newImageData[dataIdx + 2] = value;
                newImageData[dataIdx + 3] = 255;
            }
        }

        return newData;
    }

    /**
     * 处理图像
     */
    process(image, width, height, effect, intensity, options = {}) {
        switch (effect) {
            case 'grayscale':
                return this.grayscale(image, width, height, intensity);
            case 'emboss':
                return this.emboss(image, width, height, intensity, options.angle || 45);
            case 'woodcarving':
                return this.woodcarving(image, width, height, intensity, options.pattern || 'horizontal');
            case 'edge':
                return this.edge(image, width, height, intensity);
            default:
                return this.grayscale(image, width, height, intensity);
        }
    }
}
