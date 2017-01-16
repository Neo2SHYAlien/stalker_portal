
        function TestTable1() {
            $('#datatable-1').on('xhr.dt', function (e, settings, json) {
                if (typeof (json.data) == 'object') {
                    for (var i in json.data) {
                        var id = json.data[i].id;
                        var censored = json.data[i].censored;
                        json.data[i].operations = "<div class='col-xs-3 col-sm-8'>\n\
                                                        <a href='#' class='dropdown-toggle no_context_menu' data-toggle='dropdown'>\n\
                                                            <i class='pull-right fa fa-cog'></i>\n\
                                                        </a>\n\
                                                        <ul class='dropdown-menu pull-right'>\n\
                                                            <li>\n\
                                                                <a class='no_context_menu' href='{{ app.request_context.baseUrl }}/{{ app.controller_alias }}/edit-tv-genres' data-genre-censored='" + censored + "' data-genresid='" + id + "' id='edit_tv_genres_" + id + "'>\n\
                                                                    <span>{{ 'Edit'|trans }}</span>\n\
                                                                </a>\n\
                                                            </li>\n\
                                                            <li>\n\
                                                                <a class='main_ajax no_context_menu' href='{{ app.request_context.baseUrl }}/{{ app.controller_alias }}/remove-tv-genres' data-genresid='" + id + "'>\n\
                                                                    <span>{{ 'Delete'|trans }}</span>\n\
                                                                </a>\n\
                                                            </li>\n\
                                                        </ul>\n\
                                                    </div>";
                        var title = json.data[i].title;

                        json.data[i].censored = censored ? "{{ 'Yes'|trans }}": "{{ 'No'|trans }}";

                        json.data[i].title = "<a class='no_context_menu'  href='{{ app.request_context.baseUrl }}/{{ app.controller_alias }}/edit-tv-genres' data-genre-censored='" + censored + "' data-genresid='" + id + "' id='edit_tv_genres_" + id + "' >" + title + "</a>";
                    }
                }
            }).dataTable({
                "processing": true,
                "serverSide": true,
                "ajax": {
                    "url": "{{ app.request_context.baseUrl }}/{{ app.controller_alias }}/tv-genres-list-json"
                },
                "language": {
                    "url": "{{ app.datatable_lang_file }}"
                },
                {% if attribute(app, 'dropdownAttribute') is defined %}
                    {{ main_macro.get_datatable_column(app['dropdownAttribute']) }}
                {% endif %}
                "lengthMenu": [-1],
                "bFilter": true,
                "bPaginate": false,
                "bInfo": true,
                "ordering": false,
                "aoColumnDefs": [
                    { className: "action-menu", "targets": [ -1 ]},
                    { "sortable": false, "targets": [-1, -2]},
                    { "searchable": false, "targets": [-1, -2]}
                ]
            }).rowReordering({
                iIndexColumn: 0,
                sURL: "{{ app.request_context.baseUrl }}/{{ app.controller_alias }}/tv-genres-reorder"
            }).closest('#iptv_list').find('.dataTables_processing').hide('', function(){$('.dataTables_filter').hide();});
            /*$('#datatable-1').DataTable().ajax.reload();*/
        }

        function yelp() {
            $(document).ready(function () {
                $(document).on('keyup', '#tv_genres_title', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    var _this = $(this);
                    if (_this.val().length < 3) {
                        return;
                    }
                    _this.next('div').removeClass('bg-danger').css('visibility', 'hidden').html('&nbsp;');
                    $('#modalbox button[type="submit"]').removeAttr("disabled");

                    ajaxPostSend('{{app.request_context.baseUrl}}/{{app.controller_alias}}/check-tv-genres-name', {title: _this.val()})

                    return false;
                });

                $(document).on('click', "a.main_ajax", function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    ajaxPostSend($(this).attr('href'), $(this).data(), false);
                    $(this).closest('div.open').removeClass('open');
                    return false;
                });

                $(document).on('click', '#add_tv_genres, a[id^="edit_tv_genres_"]', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    openModalBox($(this));
                    return false
                });

                $(document).on('click submit', "#modalbox button[type='submit'], #modalbox form", function (e) {
                    if (e.currentTarget != e.target) {
                        return;
                    }
                    var sendData = {
                        id: $("#modalbox input[type='hidden']").val(),
                        title: $("#modalbox input[type='text']").val(),
                        censored: $("#modalbox input[name='censored']").prop('checked') ? 1: 0
                    };

                    e.stopPropagation();
                    e.preventDefault();
                    ajaxPostSend($("#modalbox form").attr('action'), sendData, false);
                    JScloseModalBox();
                    return false;
                });

                LoadDataTablesScripts(TestTable1);
            });
        }

        document.addEventListener("DOMContentLoaded", yelp, false);

        var addTvGenre = function(data){
            JSSuccessModalBox(data);
            $('#datatable-1').DataTable().ajax.reload();
        };

        var addTvGenreError = function(data){
            JSErrorModalBox(data);
        };

        var editTvGenre = function(data){
            JSSuccessModalBox(data);
            $('#datatable-1').DataTable().ajax.reload();
        };
        var editTvGenreError = function(data){
            JSErrorModalBox(data);
        };
        
        var removeTvGenre = function (data) {
            JSSuccessModalBox(data);
            $('#datatable-1').DataTable().ajax.reload();
        };
        var removeTvGenreError = function(data){
            JSErrorModalBox(data);
        };
        
    function closeModalBox(){
        $("#modalbox").hide();
        $('#modalbox').find('.modal-header-name span').empty();
        $('#modalbox').find('.devoops-modal-inner').empty();
    }
    
    function openModalBox(obj){
        $('#modalbox').find('.modal-header-name span').text((obj.data('genresid')? '{{ 'Edit'|trans }}': '{{ 'Add'|trans }}') + ' {{ 'genre'|trans }}');
        if ($('#modalbox').find('.devoops-modal-inner').find('input').length == 0) {
            $('#modalbox').find('.devoops-modal-inner').html('\n\
                <div class="box-content">\n\
                    <form class="form-horizontal" role="form">\n\
                        <div class="form-group">\n\
                            <label class="col-sm-3 control-label col-sm-offset-1">{{ 'Genre'|trans }}</label>\n\
                            <div class="col-xs-10 col-sm-8">\n\
                                <span class="col-xs-8 col-sm-8">\n\
                                    <input type="hidden" name="id">\n\
                                    <input type="text" class="own_fields form-control " name="title" id="tv_genres_title">\n\
                                    <div class="bg-danger"></div>\n\
                                </span>\n\
                            </div>\n\
                            <label class="col-sm-3 control-label col-sm-offset-1">{{ 'Age restriction'|trans }}</label>\n\
                            <div class="col-xs-10 col-sm-8">\n\
                                <span class="col-xs-8 col-sm-8">\n\
                                    <div class="checkbox">\n\
                                        <label>\n\
                                            <input type="checkbox" class="own_fields form-control " value="1" name="censored" id="tv_genres_censored">\n\
                                            <i class="fa fa-square-o small"></i>\n\
                                        </label>\n\
                                        <div class="bg-danger"></div>\n\
                                    </div>\n\
                                </span>\n\
                            </div>\n\
                        </div>\n\
                    </form>\n\
                </div>');
            $('#modalbox').find('.devoops-modal-bottom').html('<div class=pull-right no-padding">&nbsp;</div>\n\
                        <div class="pull-right no-padding">\n\
                            <button type="submit" class="btn btn-success pull-right">{{ 'Save'|trans }}</button>\n\
                            <button type="reset" class="btn btn-default pull-right" >{{ 'Cancel'|trans }}</button>\n\
                        </div>');
        }
        
        if (obj.data('genresid')) {
            $('#modalbox').find('.devoops-modal-inner').find('input[type="hidden"]').val(obj.data('genresid'));
            $('#modalbox').find('.devoops-modal-inner').find('input[type="text"]').val(obj.closest('tr').find('a:first').text());
            $('#modalbox').find('.devoops-modal-inner').find('input[name="censored"]').prop('checked', obj.data('genre-censored') && ('' + obj.data('genre-censored')) == '1');
        } else {
            $('#modalbox').find('.devoops-modal-inner').find('input[type="hidden"]').val('');
            $('#modalbox').find('.devoops-modal-inner').find('input[type="text"]').val('');
            $('#modalbox').find('.devoops-modal-inner').find('input[name="censored"]').prop('checked', false);
        }
        $('#modalbox button[type="submit"]').removeAttr("disabled");
        $('#tv_genres_title').next('div').removeClass('bg-danger').css('visibility', 'hidden').html('&nbsp;');
        $('#modalbox form').attr('action', obj.attr('href'));
        $("#modalbox").show();
        obj.closest('div.open').removeClass('open');
    }
