FROM node:latest as builder
ENV CODEDIR=/opt/code/ NODE_ENV=production

RUN mkdir -p "${CODEDIR}"
WORKDIR "${CODEDIR}"

COPY package.json "${CODEDIR}"
COPY yarn.lock "${CODEDIR}"
RUN yarn install

COPY . "${CODEDIR}"
RUN yarn build


FROM nginx:alpine
ENV CODEDIR=/opt/code/
RUN mkdir /app/

COPY --from=builder "${CODEDIR}/dist/" /app

