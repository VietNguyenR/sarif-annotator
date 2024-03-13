# sarif-annotator 
[![MegaLinter](https://github.com/vietnguyenr/sarif-annotator/workflows/MegaLinter/badge.svg?branch=main)](https://github.com/vietnguyenr/sarif-annotator/actions?query=workflow%3AMegaLinter+branch%3Amain)
<br>
This workflow is meant to work with code analyzer in the MegaLinter. This will read combined SARIF report and anotate the outputted problem in the file change section of the pull request. Report of analyzer that do not produce SARIF output will not work with this workflow.
Example.
```yml
- name: Annotation
    if: ${{ success() }} || ${{ failure() }}
    uses: vietnguyenr/sarif-annotator@1.0.0
    with: 
        sarif_path: 'megalinter-reports/megalinter-report.sarif'
```
Reference: [https://docs.oasis-open.org/sarif/sarif/v2.0/csprd02/sarif-v2.0-csprd02.html](https://docs.oasis-open.org/sarif/sarif/v2.0/csprd02/sarif-v2.0-csprd02.html)
