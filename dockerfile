# 第一阶段：使用Node.js运行ssqq-web生成dist文件
FROM node:18-alpine AS ssqq-builder

WORKDIR /app

# 设置淘宝镜像源
RUN npm config set registry https://registry.npmmirror.com/

# 直接运行ssqq-web，使用timeout确保进程不会无限运行
RUN timeout 30s npx ssqq-web hostname=127.0.0.1 port=8081 || echo "Process completed or timed out"

# 第二阶段：使用Nginx提供静态文件
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*
COPY --from=ssqq-builder /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    find /usr/share/nginx/html -type f -exec chmod 644 {} \;

RUN sed -i 's/listen       80;/listen       8080;/' /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]