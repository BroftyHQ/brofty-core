import {QdrantClient} from '@qdrant/js-client-rest';
import { QDRANT_KEY, QDRANT_URI } from '../common/constants';


// or connect to Qdrant Cloud
const qdrand = new QdrantClient({
    url: QDRANT_URI,
    apiKey: QDRANT_KEY,
});

export default qdrand;