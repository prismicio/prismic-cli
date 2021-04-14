import { Client } from '../prismic'
import SliceZone from 'next-slicezone'
import { useGetStaticProps, useGetStaticPaths } from 'next-slicezone/hooks'

import resolver from <% if (useSrc === true) { %> '../../sm-resolver' <% } else { %> '../sm-resolver' <% } %>

const Page = (props) => <SliceZone {...props} resolver={resolver} />


// Fetch content from prismic
export const getStaticProps = useGetStaticProps({
  client: Client(),
  uid: ({ params }) => params.uid
})

export const getStaticPaths = useGetStaticPaths({
  client: Client(),
  type: 'page',
  fallback: true,// process.env.NODE_ENV === 'development',
  formatPath: ({ uid }) => ({ params: { uid }})
})

export default Page