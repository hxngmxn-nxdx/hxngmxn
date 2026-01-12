---
layout: default
title: Projects
permalink: /projects/
---

<div class="layout">
  {% include sidebar.html %}
  <main class="content">
    <div class="section-title">Projects</div>
    {% assign groups = site.posts | group_by_exp: "post", "post.project | default: 'Misc'" | sort: "name" %}

    <div class="projects">
      {% for group in groups %}
        {% assign items_by_day = group.items | group_by_exp: "post", "post.date | date: '%Y-%m-%d'" | sort: "name" | reverse %}

        <details class="project-folder">
          <summary class="project-summary">
            <span class="project-name">{{ group.name | upcase }}</span>
            <span class="project-count">({{ group.items | size }})</span>
          </summary>

          <div class="project-posts">
            {% for day in items_by_day %}
              {% assign day_posts = day.items | sort: "date" | reverse %}
              {% assign sequenced_posts = day_posts | where_exp: "post", "post.sequence != nil" | sort: "sequence" | reverse %}
              {% assign unsequenced_posts = day_posts | where_exp: "post", "post.sequence == nil" %}
              {% assign ordered_day_posts = sequenced_posts | concat: unsequenced_posts %}

              {% for post in ordered_day_posts %}
                <div class="project-post-entry">
                  <span class="post-date">[{{ post.date | date: "%Y-%m-%d" }}]</span>
                  <div class="project-post-body">
                    <a class="post-link" href="{{ post.url | relative_url }}">{{ post.title }}</a>
                    <div class="post-meta">
                      {% include reading_time.html content=post.content %}
                    </div>
                  </div>
                </div>
                <div class="post-separator" aria-hidden="true"></div>
              {% endfor %}
            {% endfor %}
          </div>
        </details>
      {% endfor %}
    </div>
  </main>
</div>
