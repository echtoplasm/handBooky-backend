const nonVectorQuery = param => {
  return (
    `SELECT
            text,
            COALESCE(metadata->>'page', metadata->>'url', 'website') as source_info,
            'website' as source_type,
            metadata->>'url' as source_url,
            metadata->>'section' as section_type,
            CASE 
              WHEN metadata->'prerequisites' IS NOT NULL 
              THEN array_to_string(
                ARRAY(SELECT jsonb_array_elements_text(metadata->'prerequisites')), 
                ', '
              )
              ELSE NULL
            END as class_prerequisites,
            CASE 
              WHEN metadata->'corequisites' IS NOT NULL
              THEN array_to_string(
                ARRAY(SELECT jsonb_array_elements_text(metadata->'corequisites')), 
                ', '
              )
              ELSE NULL
            END as class_corequisites,
            CASE 
              WHEN metadata->>'content_type' = 'course'
              THEN substring(metadata->>'doc_id' from '/([A-Z]{2,4}-\d{2,4})-')
              ELSE null 
            END as course_code,
           FROM 
            rag_chunks_website
           WHERE metadata->>'doc_id' ILIKE $1`,
  );
};

module.exports = nonVectorQuery;
