import os
import glob

PIXEL_SNIPPET = """<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '869358656017955');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=869358656017955&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->
</head>"""

directory = r"c:\Users\User}\OneDrive\Documentos\Escritorio\natural be"

modified_count = 0

for filepath in glob.glob(os.path.join(directory, "*.html")):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if "869358656017955" in content and "fbq('init'" in content:
        continue # Already injected

    if "</head>" in content:
        content = content.replace("</head>", PIXEL_SNIPPET, 1) # Replace the first occurrence
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        modified_count += 1

print(f"Modified {modified_count} HTML files in root directory.")

# Now process subdirectories like categoria, blog (if they exist and have HTML files, though normally it's flat in this project)
for root, dirs, files in os.walk(directory):
    if ".git" in root or ".venv" in root or "node_modules" in root:
        continue
    if root == directory:
        continue # already covered
    for file in files:
        if file.endswith(".html"):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if "869358656017955" in content and "fbq('init'" in content:
                continue
                
            if "</head>" in content:
                content = content.replace("</head>", PIXEL_SNIPPET, 1)
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                modified_count += 1
                
print(f"Total modified: {modified_count} HTML files.")
