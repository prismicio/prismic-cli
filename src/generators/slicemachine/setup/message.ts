const sliceZoneReadmeUrl = (framework?: string): string => {
  switch (framework) {
  case 'nuxt': return 'https://prismic.io/docs/technologies/vue-slicezone-technical-reference'
  case 'next': return 'https://github.com/prismicio/slice-machine/tree/master/packages/next-slicezone'
  default: return 'https://github.com/prismicio/slice-machine/'
  }
}

const quickStartDocsUrl = (framework?: string): string => {
  switch (framework) {
  case 'nuxt': return 'https://prismic.io/docs/technologies/nuxtjs';
  case 'next': return 'https://prismic.io/docs/technologies/quick-start-nextjs';
  default: return 'https://slicemachine.dev/documentation/getting-started';
  }
}

const addSlicesDocsUrl = (framework?: string): string => {
  switch (framework) {
  case 'nuxt': return 'https://prismic.io/docs/technologies/generate-model-component-nuxtjs';
  case 'next': return 'https://prismic.io/docs/technologies/create-your-own-slices-components-nextjs';
  default: return 'https://www.slicemachine.dev/';
  }
}

const writingRoomUrl = (domain?: string, base = 'https://prismic.io'): string => {
  const url = new URL(base)
  if (!domain) {
    url.pathname = 'dashboard'
    return url.toString()
  }
  url.hostname = `${domain}.${url.hostname}`
  url.pathname = 'documents'
  return url.toString()
}

export default function message(framework?: 'next' | 'nuxt'| string, domain?: string, base = 'https://prismic.io') {
  return `
Your project is now configured to use SliceMachine!
Follow these next steps to get going:

- Add the SliceZone, anywhere in your code
${sliceZoneReadmeUrl(framework)}

- Access your Prismic writing room here
${writingRoomUrl(domain, base)}

- To add your own slice, run this command
$> npx prismic-cli sm --create-slice

If you're not sure where you should start,
give SliceMachine documentation a try:

- Quick Start 👉 ${quickStartDocsUrl(framework)}
- Adding slices 👉 ${addSlicesDocsUrl(framework)}
`
}
