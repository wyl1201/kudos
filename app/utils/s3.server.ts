import { UploadHandler, unstable_parseMultipartFormData } from '@remix-run/node'
import AWS from 'aws-sdk'
import cuid from 'cuid'
import { Readable } from 'stream'

async function asyncIterableToReadableStream(asyncIterable) {
  const readableStream = new Readable({
    async read() {
      for await (const chunk of asyncIterable) {
        this.push(chunk)
      }
      this.push(null)
    },
  })
  return readableStream
}

async function asyncIterableToBuffer(asyncIterable) {
    const chunks = [];
    for await (const chunk of asyncIterable) {
        chunks.push(chunk);
    }
    const concatenated = Buffer.concat(chunks); // 或者 new Uint8Array(concatenated);
    return concatenated;
}

const s3 = new AWS.S3({
  region: process.env.KUDOS_BUCKET_REGION,
  accessKeyId: process.env.KUDOS_ACCESS_KEY_ID,
  secretAccessKey: process.env.KUDOS_SECRET_ACCESS_KEY,
})

export const uploadHandler: UploadHandler = async ({
  name,
  filename,
  contentType,
  data,
}) => {
  if (name !== 'profile-pic') {
    return
  }

  const { Location } = await s3
    .upload({
      Bucket: process.env.KUDOS_BUCKET_NAME || '',
      Key: `public/${cuid()}.${filename?.split('.').slice(-1)}`,
      Body: await asyncIterableToBuffer(data),
    })
    .promise()
  console.log(`🚀 ~ Location:`, Location)

  return Location
}

export async function uploadAvatar(request: Request) {
  const formData = await unstable_parseMultipartFormData(request, uploadHandler)

  const file = formData.get('profile-pic')?.toString() || ''

  return file
}
